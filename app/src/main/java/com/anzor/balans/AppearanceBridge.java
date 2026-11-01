package com.anzor.balans;

import android.webkit.JavascriptInterface;
import android.webkit.WebView;

public class AppearanceBridge {
    private final MainActivity activity;
    private final WebView webView;

    public AppearanceBridge(MainActivity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public void setTheme(String theme) {
        // Apply theme
    }

    @JavascriptInterface
    public String getTheme() {
        return "default";
    }

    @JavascriptInterface
    public void setIdentity(String identityJson) {
        // Store identity
    }

    @JavascriptInterface
    public String getIdentity() {
        return "{}";
    }
}
