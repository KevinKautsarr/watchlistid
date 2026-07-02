import React, { useRef, useEffect, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { X, RotateCw } from 'lucide-react-native';
import { Colors, Radius, Spacing, Shadow, FontSize, FontWeight } from '@/constants/theme';
import { APP_URL } from '@/config';

import type { WebView as WebViewType, WebViewMessageEvent } from 'react-native-webview';

// Import WebView conditionally to avoid errors on Web
let WebView: typeof WebViewType | undefined;
try {
  if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').WebView;
  }
} catch (e) {
  // WebView not available on this platform
}

interface CaptchaModalProps {
  visible: boolean;
  onCancel: () => void;
  onVerify: (token: string) => void;
}

const CLOUDFLARE_SITE_KEY = process.env.EXPO_PUBLIC_CLOUDFLARE_SITE_KEY || '1x00000000000000000000AA';
// IMPORTANT: this must be a domain registered under this site key in the
// Cloudflare Turnstile dashboard (Settings → Turnstile → widget → Domains),
// otherwise Turnstile silently refuses to render inside the native WebView.
// Using an unrelated domain (e.g. google.com) was the root cause of Turnstile
// failing on iOS WKWebView, which a previous version "fixed" by sending a fake
// 'ios-bypass-token' — a security hole (see git history). Never reintroduce
// a bypass; if Turnstile fails to load, show a retry UI instead.
const BASE_URL = APP_URL;
// How long to wait before offering a manual retry if Turnstile hasn't rendered.
const CAPTCHA_LOAD_TIMEOUT_MS = 8000;

export default function CaptchaModal({ visible, onCancel, onVerify }: CaptchaModalProps) {
  const webViewRef = useRef<WebViewType>(null);
  const webIframeRef = useRef<HTMLIFrameElement>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleVerify = (token: string) => {
    setCaptchaVerified(true);
    onVerify(token);
  };

  const handleRetry = () => {
    setShowRetry(false);
    setReloadKey(k => k + 1);
  };

  // If Turnstile hasn't verified within the timeout (e.g. it failed to render
  // in a restricted WebView), offer a manual retry instead of silently
  // bypassing verification.
  useEffect(() => {
    if (!visible || captchaVerified) return;
    setShowRetry(false);
    const timeout = setTimeout(() => setShowRetry(true), CAPTCHA_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [visible, captchaVerified, reloadKey]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setCaptchaVerified(false);
      setShowRetry(false);
    }
  }, [visible]);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #202020;
          }
        </style>
      </head>
      <body>
        <div class="cf-turnstile" 
             data-sitekey="${CLOUDFLARE_SITE_KEY}" 
             data-callback="onSuccess"
             data-theme="dark">
        </div>
        <script>
          function onSuccess(token) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(token);
            } else {
              window.parent.postMessage(token, '*');
            }
          }
        </script>
      </body>
    </html>
  `;

  // Listen for message on Web
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event: MessageEvent) => {
        // Only accept the token from our own captcha iframe — not arbitrary windows
        if (event.source !== webIframeRef.current?.contentWindow) return;
        if (event.data && typeof event.data === 'string' && event.data.length > 30) {
          handleVerify(event.data);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [onVerify]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.container}>
          <View style={s.header}>
            <Text style={s.title}>Verifikasi Keamanan</Text>
            <TouchableOpacity onPress={onCancel} style={s.closeBtn}>
              <X size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={s.webContainer}>
            {Platform.OS === 'web' ? (
              <iframe
                key={reloadKey}
                ref={webIframeRef}
                srcDoc={html}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Captcha"
              />
            ) : WebView ? (
              <WebView
                key={reloadKey}
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html, baseUrl: BASE_URL }}
                onMessage={(event: WebViewMessageEvent) => {
                  const token = event.nativeEvent.data;
                  if (token) handleVerify(token);
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                style={s.webview}
                scrollEnabled={true}
              />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>WebView tidak didukung.</Text>
              </View>
            )}

            {showRetry && !captchaVerified && (
              <View style={s.retryOverlay}>
                <Text style={s.retryText}>Verifikasi gagal dimuat.</Text>
                <TouchableOpacity onPress={handleRetry} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Coba lagi">
                  <RotateCw size={16} color={Colors.white} strokeWidth={2.5} />
                  <Text style={s.retryBtnText}>Coba Lagi</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={s.footerText}>
            Kami menggunakan Cloudflare Turnstile untuk memastikan kamu bukan robot.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  webContainer: {
    height: 300,
    width: '100%',
    backgroundColor: '#202020',
    position: 'relative',
  },
  webview: {
    backgroundColor: 'transparent',
  },
  retryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(32,32,32,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  retryText: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  footerText: {
    padding: Spacing.lg,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
