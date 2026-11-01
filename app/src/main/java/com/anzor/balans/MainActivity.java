package com.anzor.balans;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * «Баланс» — концепт приложения о здоровье в WebView.
 * Весь интерфейс лежит в assets/index.html и работает офлайн.
 */
public class MainActivity extends AppCompatActivity {

    private static final int FILE_CHOOSER_CODE = 1001;

    private WebView webView;
    private HealthBridge healthBridge;
    private BleBridge bleBridge;
    private ReminderBridge reminderBridge;
    private ValueCallback<Uri[]> fileChooseCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("file".equals(uri.getScheme()) && uri.toString().equals("file:///android_asset/index.html")) return false;
                if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                }
                return true;
            }
        });
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setBackgroundColor(0xFF0B0F15);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                            FileChooserParams params) {
                if (fileChooseCallback != null) fileChooseCallback.onReceiveValue(null);
                fileChooseCallback = callback;
                try {
                    Intent i = params.createIntent();
                    startActivityForResult(Intent.createChooser(i, "Выбрать файл"), FILE_CHOOSER_CODE);
                } catch (Exception e) {
                    fileChooseCallback = null;
                    return false;
                }
                return true;
            }
        });

        webView.addJavascriptInterface(new SaveBridge(), "BalansSave");
        healthBridge = new HealthBridge(this, webView);
        webView.addJavascriptInterface(healthBridge, "BalansHealth");
        bleBridge = new BleBridge(this, webView);
        webView.addJavascriptInterface(bleBridge, "BalansBle");
        webView.addJavascriptInterface(new AppearanceBridge(this,webView), "BalansAppearance");
        reminderBridge = new ReminderBridge(this,webView);
        webView.addJavascriptInterface(reminderBridge,"BalansReminders");

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl("file:///android_asset/index.html");
        }
    }

    @Override protected void onDestroy() {
        if (healthBridge != null) healthBridge.close();
        if (bleBridge != null) bleBridge.close();
        if (reminderBridge != null) reminderBridge.close();
        if (webView != null) {
            webView.removeJavascriptInterface("BalansHealth");
            webView.removeJavascriptInterface("BalansSave");
            webView.removeJavascriptInterface("BalansBle");
            webView.removeJavascriptInterface("BalansAppearance");
            webView.removeJavascriptInterface("BalansReminders");
            webView.destroy();
        }
        super.onDestroy();
    }
    @Override protected void onStop() {
        if (healthBridge != null) healthBridge.onHostStop();
        if (bleBridge != null) bleBridge.onHostStop();
        super.onStop();
    }
    @Override protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            webView.evaluateJavascript("window.BalansHealth&&window.onHealthEvent&&window.BalansHealth.status()", null);
            webView.evaluateJavascript("window.onAppForeground&&window.onAppForeground()", null);
        }
        if (healthBridge != null) {
            healthBridge.syncRange(7);
        }
    }

    private class SaveBridge {
        @JavascriptInterface
        public void shareText(String text) {
            if(text==null || text.length()>1024*1024)return;
            runOnUiThread(()->{
                try {
                    Intent send=new Intent(Intent.ACTION_SEND);
                    send.setType("text/plain");
                    send.putExtra(Intent.EXTRA_TEXT,text);
                    startActivity(Intent.createChooser(send,"Поделиться отчётом"));
                } catch(Exception e) {
                    nativeStatus("Не удалось открыть меню отправки");
                }
            });
        }
        @JavascriptInterface
        public void save(String name, String base64, String type) {
            try {
                if (name == null || name.contains("/") || name.contains("\\") || name.length() > 180
                        || base64 == null || base64.length() > 28 * 1024 * 1024) {
                    throw new IllegalArgumentException("Invalid export");
                }
                byte[] bytes = Base64.decode(base64, Base64.NO_WRAP);
                if (android.os.Build.VERSION.SDK_INT >= 29) {
                    android.content.ContentValues values = new android.content.ContentValues();
                    values.put(android.provider.MediaStore.Downloads.DISPLAY_NAME,name);
                    values.put(android.provider.MediaStore.Downloads.MIME_TYPE,type == null ? "application/octet-stream" : type);
                    values.put(android.provider.MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS+"/Balans");
                    values.put(android.provider.MediaStore.Downloads.IS_PENDING,1);
                    Uri uri=getContentResolver().insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI,values);
                    if(uri==null)throw new java.io.IOException("Cannot create download");
                    try {
                        try(OutputStream os=getContentResolver().openOutputStream(uri)) {
                            if(os==null)throw new java.io.IOException("Cannot write download");
                            os.write(bytes);
                        }
                        android.content.ContentValues ready=new android.content.ContentValues();
                        ready.put(android.provider.MediaStore.Downloads.IS_PENDING,0);
                        getContentResolver().update(uri,ready,null,null);
                    } catch(Exception e) {
                        getContentResolver().delete(uri,null,null);
                        throw e;
                    }
                    nativeStatus("Сохранено: Загрузки / Balans / "+name);
                    return;
                }
                File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) dir = getFilesDir();
                if (!dir.exists()) dir.mkdirs();
                File f = new File(dir, name);
                try (OutputStream os = new FileOutputStream(f)) {
                    os.write(bytes);
                }
                nativeStatus("Сохранено: " + f.getAbsolutePath());
            } catch (Exception e) {
                Log.e("Balans", "save failed", e);
                nativeStatus("Не удалось сохранить файл");
            }
        }
    }
    private void nativeStatus(String message) {
        runOnUiThread(() -> webView.evaluateJavascript(
                "window.onNativeStatus&&window.onNativeStatus(" + org.json.JSONObject.quote(message) + ")", null));
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_CODE && fileChooseCallback != null) {
            fileChooseCallback.onReceiveValue(
                    WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileChooseCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null) {
            webView.evaluateJavascript(
                    "(function(){var s=document.querySelector('#sheet');" +
                    "if(s&&s.classList.contains('on')){closeSheet();return '1'}" +
                    "if(typeof state!=='undefined'&&state.stack&&state.stack.length){go('back');return '1'}" +
                    "return '0'})()",
                    value -> {
                        if (!"\"1\"".equals(value)) {
                            runOnUiThread(() -> MainActivity.this.finish());
                        }
                    });
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }
}
