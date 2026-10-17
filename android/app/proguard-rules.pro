# Optimization & Obfuscation Rules for BillSetu
-repackageclasses 'in.billsetu.app.internal'
-allowaccessmodification

# Keep WebKit and JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class androidx.webkit.** { *; }
-dontwarn androidx.webkit.**

# Keep models and app classes
-keep class in.billsetu.app.** { *; }

# Strip verbose debug logging in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}
