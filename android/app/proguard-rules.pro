# Optimization & Protection Rules for BillSetu
-keep public class in.billsetu.app.MainActivity { *; }
-keep public class in.billsetu.app.BillSetuApp { *; }
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application

# Keep WebKit and JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class androidx.webkit.** { *; }
-dontwarn androidx.webkit.**

# Keep all BillSetu app classes
-keep class in.billsetu.app.** { *; }

# Strip verbose debug logging in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}
