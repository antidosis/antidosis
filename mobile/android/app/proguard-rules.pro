# ── Capacitor / Cordova ──────────────────────────────────────────────
# Keep Capacitor bridge and plugin classes
-keep public class com.capacitorjs.plugins.** { *; }
-keep public class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }

# Capawesome Firebase plugins (loaded via reflection)
-keep public class io.capawesome.capacitor.firebase.** { *; }
-keep public class io.capawesome.capacitor.** { *; }

# Cordova plugins (loaded via reflection)
-keep public class * extends org.apache.cordova.CordovaPlugin { *; }
-keep public class com.android.billingclient.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep JavascriptInterface for WebView bridge
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Firebase ─────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firebase Crashlytics needs these
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
-keep class com.google.firebase.crashlytics.** { *; }

# Firebase Sessions uses androidx.datastore — R8 strips this without explicit keep
-keep class androidx.datastore.** { *; }
-keep class androidx.datastore.core.** { *; }
-keep class androidx.datastore.preferences.** { *; }
-dontwarn androidx.datastore.**

# Kotlin coroutines (used by Firebase)
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# ── General Android ──────────────────────────────────────────────────
# Keep line numbers for debugging stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep annotations
-keepattributes *Annotation*

# Keep Serializable/Parcelable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# ── WebView ──────────────────────────────────────────────────────────
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# ── R8 / Reflection safety ───────────────────────────────────────────
# Don't warn about missing classes from optional dependencies
-dontwarn java.lang.invoke.StringConcatFactory
-dontwarn org.bouncycastle.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**
