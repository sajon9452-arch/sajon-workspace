# Android WebView & AppCreator24 Camera Permission Setup Guide

এই নির্দেশিকাটি সিলেট মানব সেবা সংগঠন ওয়েব অ্যাপের লাইভ ফেস স্ক্যান (Live Face Scan) ফিচারটি অ্যান্ড্রয়েড অ্যাপ অথবা AppCreator24 কন্টেইনারে সফলভাবে চালানোর জন্য তৈরি করা হয়েছে।

---

## ১. AppCreator24 কনফিগারেশন চেকলিস্ট (AppCreator24 Settings)

আপনি যদি **AppCreator24** দিয়ে ওয়েবসাইটটিকে অ্যান্ড্রয়েড অ্যাপে রূপান্তর করে থাকেন, তবে নিচের সেটিংসগুলো নিশ্চিত করুন:

1. **General Info > Name and Icon:**
   - অ্যাপের নাম ও আইকন ঠিক করুন।
2. **General Info > General > Permissions:**
   - **Camera:** `Yes` (বাধ্যতামূলক সক্রিয় করুন)
   - **Microphone:** `Yes` / `Optional`
3. **Sections > আপনার Web Section (URL):**
   - সেকশন এডিট করুন।
   - **Advanced settings / WebView options** এ যান:
     - **Allow access to camera and microphone:** `Yes` (চালু করুন)
     - **Enable JavaScript:** `Yes`
     - **DOM Storage:** `Yes`
     - **Enable Geolocation:** `Yes` (ঐচ্ছিক)
4. **Build APK:**
   - সেটিংস সেভ করে নতুন করে APK জেনারেট ও ডাউনলোড করুন। ফোনে আগের ভার্সন আনইনস্টল করে নতুন APK ইনস্টল করুন।

---

## ২. Android Studio (Native WebView) কনফিগারেশন

আপনি যদি কাস্টম অ্যান্ড্রয়েড স্টুডিও প্রজেক্ট ব্যবহার করেন:

### ক. `AndroidManifest.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="org.sylhetmanabseva.app">

    <!-- ক্যামেরা ও ইন্টারনেট পারমিশন -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />

    <!-- ক্যামেরা হার্ডওয়্যার ফিচার -->
    <uses-feature
        android:name="android.hardware.camera"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.camera.front"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.camera.autofocus"
        android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

---

### খ. `MainActivity.java`
```java
package org.sylhetmanabseva.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private WebView myWebView;
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1001;
    private PermissionRequest pendingPermissionRequest;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        myWebView = findViewById(R.id.webview);

        // 1. WebSettings কনফিগারেশন
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);

        // 2. WebChromeClient দিয়ে ক্যামেরা পারমিশন ডেলিগেশন
        myWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // অ্যান্ড্রয়েড সিস্টেম পারমিশন রানটাইমে নিশ্চিত করা
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                        == PackageManager.PERMISSION_GRANTED) {
                    request.grant(request.getResources());
                } else {
                    pendingPermissionRequest = request;
                    ActivityCompat.requestPermissions(MainActivity.this,
                            new String[]{Manifest.permission.CAMERA},
                            CAMERA_PERMISSION_REQUEST_CODE);
                }
            }
        });

        myWebView.setWebViewClient(new WebViewClient());

        // 3. অ্যাপের লাইভ ওয়েবসাইট লোড করুন
        myWebView.loadUrl("https://ais-dev-tr4vvlrrs4yxe5vwlqspwz-398319441981.asia-southeast1.run.app");

        // 4. অ্যাপ ওপেন হলেই ক্যামেরা পারমিশন রিকুয়েস্ট
        checkAndRequestSystemCameraPermission();
    }

    private void checkAndRequestSystemCameraPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA},
                    CAMERA_PERMISSION_REQUEST_CODE);
        }
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
        if (myWebView.canGoBack()) {
            myWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

---

## ৩. ব্যবহারকারীর মোবাইলে সমস্যা হলে করণীয়

ব্যবহারকারীর ফোনে যদি পারমিশন পূর্বে ব্লক হয়ে থাকে:
1. মোবাইলের **Settings > Apps (অ্যাপস) > সিলেট মানব সেবা সংগঠন** এ যান।
2. **Permissions (অনুমতিসমূহ)** এ ট্যাপ করুন।
3. **Camera (ক্যামেরা)** অপশনে ট্যাপ করে **"Allow" (অনুমতি দিন)** সিলেক্ট করুন।
4. অ্যাপে এসে **"ক্যামেরা অনুমতি দিন ও পুনরায় চেষ্টা করুন"** বাটনে ট্যাপ করুন।
