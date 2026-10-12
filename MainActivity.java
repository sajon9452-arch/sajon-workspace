package org.sylhetmanabseva.app;

import android.Manifest;
import android.annotation.TargetApi;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1001;
    private PermissionRequest pendingPermissionRequest;
    private static final String APP_URL = "https://ais-dev-tr4vvlrrs4yxe5vwlqspwz-398319441981.asia-southeast1.run.app";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);

        // 1. Configure WebSettings
        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setDatabaseEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setAllowFileAccess(true);
        ws.setAllowContentAccess(true);
        ws.setJavaScriptCanOpenWindowsAutomatically(true);
        ws.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            ws.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // 2. WebChromeClient delegation to automatically grant camera requests inside the app
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                        == PackageManager.PERMISSION_GRANTED) {
                    request.grant(request.getResources());
                } else {
                    pendingPermissionRequest = request;
                    ActivityCompat.requestPermissions(
                            MainActivity.this,
                            new String[]{Manifest.permission.CAMERA},
                            CAMERA_PERMISSION_REQUEST_CODE
                    );
                }
            }
        });

        // 3. Robust WebViewClient with Offline & Network Error Interception (Suppresses raw browser error pages like ERR_QUIC_PROTOCOL_ERROR)
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }

            @TargetApi(Build.VERSION_CODES.N)
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                view.loadUrl(request.getUrl().toString());
                return true;
            }

            // Android M+ (API 23+)
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                    showCustomOfflineErrorPage(view);
                }
            }

            // Legacy Android (< API 23)
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                showCustomOfflineErrorPage(view);
            }

            // HTTP error interception (e.g. 502, 503)
            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                if (request != null && request.isForMainFrame() && errorResponse != null && errorResponse.getStatusCode() >= 500) {
                    showCustomOfflineErrorPage(view);
                }
            }
        });

        // 4. Request Camera system runtime permission on launch if not granted
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.CAMERA},
                    CAMERA_PERMISSION_REQUEST_CODE
            );
        }

        // 5. Initial load or offline screen check
        if (isNetworkAvailable()) {
            webView.loadUrl(APP_URL);
        } else {
            showCustomOfflineErrorPage(webView);
        }
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnected();
        }
        return false;
    }

    private void showCustomOfflineErrorPage(WebView view) {
        String offlineHtml = "<!DOCTYPE html>"
                + "<html lang='bn'>"
                + "<head>"
                + "<meta charset='UTF-8'>"
                + "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "<title>সংযোগ বিচ্ছিন্ন | সিলেট মানব সেবা সংগঠন</title>"
                + "<style>"
                + "  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }"
                + "  body { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; text-align: center; }"
                + "  .card { background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(51, 65, 85, 0.8); border-radius: 24px; padding: 32px 24px; max-width: 420px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); }"
                + "  .icon-wrap { width: 72px; height: 72px; border-radius: 20px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; color: #ef4444; }"
                + "  .icon-wrap svg { width: 36px; height: 36px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }"
                + "  h1 { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }"
                + "  .org-title { font-size: 13px; font-weight: 700; color: #34d399; margin-bottom: 16px; letter-spacing: 0.5px; }"
                + "  p { font-size: 13px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }"
                + "  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 20px; border-radius: 16px; background: #059669; color: #ffffff; font-size: 14px; font-weight: 700; border: none; cursor: pointer; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.4); }"
                + "  .btn:active { transform: scale(0.98); background: #047857; }"
                + "  .tips { margin-top: 20px; padding: 12px; border-radius: 14px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(51, 65, 85, 0.5); font-size: 11px; color: #cbd5e1; text-align: left; }"
                + "  .tips ul { padding-left: 16px; margin-top: 4px; }"
                + "  .tips li { margin-bottom: 3px; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "  <div class='card'>"
                + "    <div class='icon-wrap'>"
                + "      <svg viewBox='0 0 24 24'><line x1='1' y1='1' x2='23' y2='23'></line><path d='M16.72 11.06A10.94 10.94 0 0 1 19 12.55'></path><path d='M5 12.55a10.94 10.94 0 0 1 5.17-2.39'></path><path d='M10.71 5.05A16 16 0 0 1 22.58 9'></path><path d='M1.42 9a15.91 15.91 0 0 1 4.7-2.88'></path><path d='M8.53 16.11a6 6 0 0 1 6.95 0'></path><line x1='12' y1='20' x2='12.01' y2='20'></line></svg>"
                + "    </div>"
                + "    <div class='org-title'>সিলেট মানব সেবা সংগঠন</div>"
                + "    <h1>ইন্টারনেট সংযোগ বিচ্ছিন্ন</h1>"
                + "    <p>আপনার ডিভাইসটি ইন্টারনেটের সাথে যুক্ত নেই অথবা নেটওয়ার্ক ধীরগতির। অনুগ্রহ করে সংযোগ নিশ্চিত করে আবার চেষ্টা করুন।</p>"
                + "    <button class='btn' onclick='window.location.href=\"" + APP_URL + "\"'>পুনরায় চেষ্টা করুন (Try Again)</button>"
                + "    <div class='tips'>"
                + "      <strong>সহজ সমাধান:</strong>"
                + "      <ul>"
                + "        <li>আপনার মোবাইল ডাটা অথবা Wi-Fi চালু আছে কিনা দেখুন।</li>"
                + "        <li>ফ্লাইট মোড অন করে আবার অফ করুন।</li>"
                + "      </ul>"
                + "    </div>"
                + "  </div>"
                + "</body>"
                + "</html>";

        view.loadDataWithBaseURL(null, offlineHtml, "text/html", "UTF-8", null);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                if (pendingPermissionRequest != null) {
                    pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
                    pendingPermissionRequest = null;
                }
            } else {
                if (pendingPermissionRequest != null) {
                    pendingPermissionRequest.deny();
                    pendingPermissionRequest = null;
                }
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
