# React Native and Expo specific ProGuard rules
# Keep classes that are accessed via reflection
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.views.** { *; }
-keep class androidx.recyclerview.widget.** { *; }

# Keep React Native's JavaScript executor classes
-keep class com.facebook.react.bridge.** { *; }
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.rnscreens.** { *; }

# Keep Fresco and image loading classes
-keep class com.facebook.fresco.** { *; }
-keep class com.facebook.imagepipeline.** { *; }

# Keep Hermes engine classes
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep Exponent and Expo modules
-keep class expo.** { *; }
-keep class host.exp.exponent.** { *; }
-keep class com.expolib_v1.** { *; }

# Keep React Native Navigation (if used)
-keep class com.swmansion.rnmaps.** { *; }
-keep class com.airbnb.android.react.maps.** { *; }

# Don't warn about internal members being accessed via reflection
-dontwarn com.facebook.react.turbomodule.**
-dontwarn com.swmansion.reanimated.**
-dontwarn javax.annotation.**

# Keep annotations
-keep @javax.annotation.Nullable class *
-keep @javax.annotation.ParametersAreNonnullByDefault class *

# React Native specific rules
-keepclassmembers class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keepclassmembers class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers class * implements com.facebook.react.bridge.LifecycleEventListener { *; }
-keepclassmembers class * implements com.facebook.react.bridge.UIManagerListener { *; }
-keepclassmembers enum * { *; }

# Keep source files for debugging
-keepattributes SourceFile,LineNumberTable

# OkHttp - Used by React Native networking
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Keep Kotlin classes
-keep class kotlin.reflect.** { *; }
-dontwarn kotlin.reflect.**

# Keep Realm classes if used
-keep class io.realm.** { *; }
-dontwarn io.realm.**

# Remove logging in production
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep custom exceptions
-keep class * extends java.lang.Exception

# Android-specific optimizations
-optimizations !code/allocation/variable
-optimizationpasses 5
-allowaccessmodification
-dontpreverify
-flattenpackagehierarchy
-repackageclasses ''

# Keep essential Android classes
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends android.view.View

# Keep annotations
-keepattributes *Annotation*,EnclosingMethod,InnerClasses,Signature
-keep class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator *;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep classes that might be accessed via JavaScript
-keep class au.culturepass.app.** { *; }

# Optimize generic collections
-optimizations !genericsspecification

# Keep GSON classes if used
-keep class com.google.gson.** { *; }
-dontwarn com.google.gson.**

# Keep Firebase classes if used
-keep class com.google.firebase.** { *; }