import React, { useRef } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Radius, Spacing, Shadow, FontSize, FontWeight } from '../../constants/theme';

// Import WebView conditionally to avoid errors on Web
let WebView: any;
try {
  if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').WebView;
  }
} catch (e) {
  console.log('WebView not available');
}

interface CaptchaModalProps {
  visible: boolean;
  onCancel: () => void;
  onVerify: (token: string) => void;
}

const CLOUDFLARE_SITE_KEY = process.env.EXPO_PUBLIC_CLOUDFLARE_SITE_KEY || '1x00000000000000000000AA';
const BASE_URL = 'https://google.com';

export default function CaptchaModal({ visible, onCancel, onVerify }: CaptchaModalProps) {
  const webViewRef = useRef<any>(null);

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
        if (event.data && typeof event.data === 'string' && event.data.length > 30) {
          onVerify(event.data);
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
                srcDoc={html}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Captcha"
              />
            ) : WebView ? (
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html, baseUrl: BASE_URL }}
                onMessage={(event: any) => {
                  const token = event.nativeEvent.data;
                  console.log('[Captcha] Token received:', token ? 'YES' : 'NO');
                  if (token) onVerify(token);
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
  },
  webview: {
    backgroundColor: 'transparent',
  },
  footerText: {
    padding: Spacing.lg,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
