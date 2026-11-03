package com.anzor.balans;

import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import org.json.JSONObject;
import java.util.Arrays;

/** Native-only launcher identity and readable real system bars. */
public final class AppearanceBridge {
    private final MainActivity activity;
    private final WebView webView;
    private static final String[] ICONS={"balance","heart","pulse","drop","leaf","sun","tracks","flower","shield","person"};
    AppearanceBridge(MainActivity activity, WebView webView) {
        this.activity=activity; this.webView=webView;
    }
    @JavascriptInterface public void status() {
        String id=activity.getPreferences(0).getString("launcherIcon","heart");
        callback(id,"");
    }
    @JavascriptInterface public void setIcon(String id) {
        if (!Arrays.asList(ICONS).contains(id)) { callback("", "Неизвестный значок"); return; }
        activity.runOnUiThread(() -> {
            String previous=activity.getPreferences(0).getString("launcherIcon","heart");
            if (id.equals(previous)) { callback(id,"Этот значок уже выбран."); return; }
            try {
                PackageManager pm=activity.getPackageManager();
                // Enable the requested launcher first. If this fails, the current
                // launcher remains available and no icon is removed.
                pm.setComponentEnabledSetting(component(id),PackageManager.COMPONENT_ENABLED_STATE_ENABLED,PackageManager.DONT_KILL_APP);
                boolean disabledPrevious=false;
                if (!previous.equals(id) && Arrays.asList(ICONS).contains(previous)) {
                    try {
                        pm.setComponentEnabledSetting(component(previous),PackageManager.COMPONENT_ENABLED_STATE_DISABLED,PackageManager.DONT_KILL_APP);
                        disabledPrevious=true;
                    } catch (Exception ignored) {
                        // Keep the previous launcher enabled rather than risking a missing icon.
                    }
                }
                if (!disabledPrevious && !previous.equals(id)) {
                    // Restore the requested icon if the old one could not be disabled,
                    // so the home screen always keeps at least one launcher entry.
                    pm.setComponentEnabledSetting(component(id),PackageManager.COMPONENT_ENABLED_STATE_ENABLED,PackageManager.DONT_KILL_APP);
                }
                activity.getPreferences(0).edit().putString("launcherIcon",id).apply();
                callback(id,"Значок выбран. Рабочий стол может обновить его с небольшой задержкой.");
            } catch (Exception e) {
                callback("","Не удалось изменить значок: "+e.getLocalizedMessage());
            }
        });
    }
    private ComponentName component(String id) {
        return new ComponentName(activity,activity.getPackageName()+".Launcher_"+id);
    }
    @JavascriptInterface public void setSystemBars(String theme,String color) {
        activity.runOnUiThread(() -> {
            int bg;
            try { bg=Color.parseColor(color); } catch (Exception ignored) { bg="light".equals(theme)?0xFFEEF1F5:0xFF0B0F15; }
            activity.getWindow().setStatusBarColor(bg);
            activity.getWindow().setNavigationBarColor(bg);
            boolean light=Color.luminance(bg)>.45;
            int flags=activity.getWindow().getDecorView().getSystemUiVisibility();
            flags &= ~(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
            if (light) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            activity.getWindow().getDecorView().setSystemUiVisibility(flags);
        });
    }
    private void callback(String id,String message) {
        activity.runOnUiThread(() -> webView.evaluateJavascript("window.onAppearanceEvent&&window.onAppearanceEvent({id:"+
            JSONObject.quote(id)+",message:"+JSONObject.quote(message)+"})",null));
    }
}
