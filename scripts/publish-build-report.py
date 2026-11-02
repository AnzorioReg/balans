import io
import json
import os
import urllib.error
import urllib.request
import urllib.parse
import zipfile
from datetime import datetime, timezone

repo=os.environ['GITHUB_REPOSITORY']
run_id=os.environ['GITHUB_RUN_ID']
token=os.environ['GH_TOKEN']
base='https://api.github.com/repos/'+repo
headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}
class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,request,fp,code,msg,response_headers,new_url):
        redirected=super().redirect_request(request,fp,code,msg,response_headers,new_url)
        if redirected is not None and urllib.parse.urlparse(new_url).netloc!='api.github.com':
            redirected.remove_header('Authorization')
        return redirected
opener=urllib.request.build_opener(SafeRedirect())
def api(path,method='GET',body=None):
    request=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method)
    with opener.open(request,timeout=60) as response:
        return json.load(response)
def optional(path):
    try:
        return api(path)
    except urllib.error.HTTPError as error:
        if error.code==404:
            return None
        raise

report={'source_sha':os.environ['SOURCE_SHA'],'result':os.environ['BUILD_RESULT'],'run_id':run_id,'run_url':'https://github.com/'+repo+'/actions/runs/'+run_id,'generated_at':datetime.now(timezone.utc).isoformat(),'jobs':[],'ui':None,'report_errors':[]}
try:
    jobs=api('/actions/runs/'+run_id+'/jobs?per_page=100')['jobs']
    report['jobs']=[{'name':job['name'],'conclusion':job['conclusion'],'steps':[{'name':step['name'],'conclusion':step['conclusion']} for step in job.get('steps',[])]} for job in jobs]
    artifacts=api('/actions/runs/'+run_id+'/artifacts?per_page=100')['artifacts']
    for item in artifacts:
        if item['name'].startswith('ui-check-') and not item['expired']:
            request=urllib.request.Request(base+'/actions/artifacts/'+str(item['id'])+'/zip',headers=headers)
            with opener.open(request,timeout=60) as response:
                data=response.read(20*1024*1024+1)
                if len(data)>20*1024*1024:
                    raise ValueError('UI artifact exceeds 20 MiB')
                archive=zipfile.ZipFile(io.BytesIO(data))
            result=next((name for name in archive.namelist() if name.endswith('results.json')),None)
            if result:
                if archive.getinfo(result).file_size>2*1024*1024:
                    raise ValueError('UI JSON exceeds 2 MiB')
                report['ui']=json.loads(archive.read(result))
            break
except Exception as error:
    report['report_errors'].append(type(error).__name__+(' HTTP '+str(error.code) if isinstance(error,urllib.error.HTTPError) else ''))

branch='ci-reports'
if optional('/git/ref/heads/'+branch) is None:
    try:
        api('/git/refs','POST',{'ref':'refs/heads/'+branch,'sha':os.environ['SOURCE_SHA']})
    except urllib.error.HTTPError as error:
        if error.code!=422:
            raise
path='/contents/debug/latest-build-report.json'
existing=optional(path+'?ref='+branch)
import base64
body={'message':'Update build report '+run_id+' [skip ci]','branch':branch,'content':base64.b64encode(json.dumps(report,ensure_ascii=False,indent=2).encode()).decode()}
if existing:
    body['sha']=existing['sha']
api(path,'PUT',body)
print('Build report published to ci-reports/debug/latest-build-report.json')
