import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, Suspense, lazy } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@mobile/hooks/useAuth";
import { MobileShell } from "@mobile/components/MobileShell";
import { HomeScreen } from "@mobile/screens/HomeScreen";
import { LoginScreen } from "@mobile/screens/LoginScreen";
import { NeedsScreen } from "@mobile/screens/NeedsScreen";
import { ChatScreen } from "@mobile/screens/ChatScreen";
import { ProfileScreen } from "@mobile/screens/ProfileScreen";
import { usePushNotifications, useStatusBar } from "@mobile/hooks/useNative";
import { registerDeviceToken } from "@mobile/lib/api";
import { EffectsLayer } from "@mobile/components/ui";
import { ToastProvider } from "@mobile/components/ToastProvider";
import { PageTransition } from "@mobile/components/PageTransition";
import { ErrorBoundary } from "@mobile/components/ErrorBoundary";

const ForgotPasswordScreen = lazy(() =>
  import("@mobile/screens/ForgotPasswordScreen").then((m) => ({ default: m.ForgotPasswordScreen }))
);
const NeedDetailScreen = lazy(() =>
  import("@mobile/screens/NeedDetailScreen").then((m) => ({ default: m.NeedDetailScreen }))
);
const PostNeedScreen = lazy(() =>
  import("@mobile/screens/PostNeedScreen").then((m) => ({ default: m.PostNeedScreen }))
);
const ChatRoomScreen = lazy(() =>
  import("@mobile/screens/ChatRoomScreen").then((m) => ({ default: m.ChatRoomScreen }))
);
const DiscoverScreen = lazy(() =>
  import("@mobile/screens/DiscoverScreen").then((m) => ({ default: m.DiscoverScreen }))
);
const ProfileDetailScreen = lazy(() =>
  import("@mobile/screens/ProfileDetailScreen").then((m) => ({ default: m.ProfileDetailScreen }))
);
const EditProfileScreen = lazy(() =>
  import("@mobile/screens/EditProfileScreen").then((m) => ({ default: m.EditProfileScreen }))
);
const ContractsScreen = lazy(() =>
  import("@mobile/screens/ContractsScreen").then((m) => ({ default: m.ContractsScreen }))
);
const ContractDetailScreen = lazy(() =>
  import("@mobile/screens/ContractDetailScreen").then((m) => ({ default: m.ContractDetailScreen }))
);
const VerifyMobileScreen = lazy(() =>
  import("@mobile/screens/VerifyMobileScreen").then((m) => ({ default: m.VerifyMobileScreen }))
);

function FullscreenLoader() {
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-[var(--void)] gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--bronze)] border-t-[var(--sun)] animate-spin" />
      <span className="text-xs font-mono text-[var(--leather)] tracking-wide">$ loading...</span>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Dark status bar for native apps
  useStatusBar("dark");

  if (loading) {
    return <FullscreenLoader />;
  }

  if (!user) {
    return (
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/login" element={<LoginScreen />} />
          <Route
            path="/forgot-password"
            element={
              <Suspense fallback={<FullscreenLoader />}>
                <ForgotPasswordScreen />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </PageTransition>
    );
  }

  return (
    <>
      <PushRegistration />
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route element={<MobileShell />}>
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/needs" element={<NeedsScreen />} />
            <Route
              path="/needs/:id"
              element={
                <Suspense fallback={<FullscreenLoader />}>
                  <NeedDetailScreen />
                </Suspense>
              }
            />
            <Route
              path="/needs/new"
              element={
                <Suspense fallback={<FullscreenLoader />}>
                  <PostNeedScreen />
                </Suspense>
              }
            />
            <Route path="/chat" element={<ChatScreen />} />
            <Route
              path="/chat/channel/:id"
              element={
                <Suspense fallback={<FullscreenLoader />}>
                  <ChatRoomScreen />
                </Suspense>
              }
            />
            <Route
              path="/chat/dm/:id"
              element={
                <Suspense fallback={<FullscreenLoader />}>
                  <ChatRoomScreen />
                </Suspense>
              }
            />
            <Route
              path="/discover"
              element={
                <Suspense fallback={<FullscreenLoader />}>
                  <DiscoverScreen />
                </Suspense>
              }
            />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route
              path="/verify-mobile"
              element={
                <Suspense fallback={<FullscreenLoader />}>
                  <VerifyMobileScreen />
                </Suspense>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <Suspense fallback={<FullscreenLoader />}>
                  <ProfileDetailScreen />
                </Suspense>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <Suspense fallback={<FullscreenLoader />}>
                  <EditProfileScreen />
                </Suspense>
              }
            />
            <Route
              path="/contracts"
              element={
                <Suspense fallback={<FullscreenLoader />}>
                  <ContractsScreen />
                </Suspense>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <Suspense fallback={<FullscreenLoader />}>
                  <ContractDetailScreen />
                </Suspense>
              }
            />
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </PageTransition>
    </>
  );
}

// Registers the device's push token with the backend once the OS grants one.
// Only mounted for authenticated users (AppRoutes renders it post-login).
function PushRegistration() {
  const onToken = useCallback((token: string) => {
    const platform = Capacitor.getPlatform();
    if (platform === "ios" || platform === "android") {
      registerDeviceToken(token, platform).catch(() => {
        // Best-effort — the token is re-delivered on the next app launch.
      });
    }
  }, []);

  usePushNotifications(onToken);

  return null;
}

function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const listener = CapacitorApp.addListener("appUrlOpen", (event) => {
      const url = new URL(event.url);
      // For the custom scheme, the first path segment lands in `host`
      // (antidosis://needs/123 → host "needs", pathname "/123").
      // Normalise to a real path so the route matching below works.
      const path =
        url.protocol === "antidosis:"
          ? `/${url.host}${url.pathname}${url.search}`
          : url.pathname + url.search;

      if (path.startsWith("/needs/")) {
        navigate(path);
      } else if (path.startsWith("/profile/")) {
        navigate(path);
      } else if (path.startsWith("/contracts/")) {
        navigate(path);
      } else if (path === "/needs" || path === "/discover" || path === "/chat") {
        navigate(path);
      } else {
        navigate("/home");
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [navigate]);

  return null;
}

// Global 403 MOBILE_NOT_VERIFIED responses (posting needs, messaging, etc.)
// funnel the user straight to the OTP flow instead of a dead-end error toast.
function MobileVerificationRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => navigate("/verify-mobile");
    window.addEventListener("auth:mobile-verification-required", handler);
    return () => window.removeEventListener("auth:mobile-verification-required", handler);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <EffectsLayer grain />
          <DeepLinkHandler />
          <MobileVerificationRedirect />
          <AppRoutes />
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
