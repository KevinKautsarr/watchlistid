import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ViewStyle } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { LanguageContext, LanguageContextType } from '@/context/LanguageContext';

interface Props {
  children: ReactNode;
  /**
   * Translation key naming this screen (e.g. "screenNameHome"). Falls back to
   * a generic "page"/"halaman" translation when omitted — never hardcode a
   * raw screen name string here, or it won't respect the active language.
   */
  screenNameKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ScreenErrorBoundary extends Component<Props, State> {
  // Class components can't use hooks, so we read the language context
  // directly. LanguageContext is exported (not just useLanguage()) for
  // exactly this case. Every current call site renders inside
  // LanguageProvider (see app/_layout.tsx), so context is never undefined
  // in practice — the fallback strings below only guard the type.
  //
  // No `declare context: ...` field here — some Babel configs (this
  // project's Metro/react-native-web pipeline) don't support the
  // `declare` class-field modifier without extra plugin config, and
  // Component's context generic doesn't reliably type `this.context`
  // either. `this.context` is cast at the one call site in render()
  // instead (see below).
  static contextType = LanguageContext;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in screen [${this.props.screenNameKey || 'Unknown'}]:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const t = (this.context as LanguageContextType | undefined)?.t;
      const screenName = (this.props.screenNameKey && t?.(this.props.screenNameKey as any)) || t?.('screenFallbackName') || 'page';
      const message = (t?.('screenErrorMessage') || 'An error occurred while loading this {screen}.').replace('{screen}', screenName);

      return (
        <View style={s.container}>
          <View style={s.iconBox}>
            <AlertTriangle size={48} color={Colors.primary} />
          </View>

          <Text style={s.title}>{t?.('screenErrorTitle') || 'Something went wrong'}</Text>
          <Text style={s.message}>{message}</Text>

          <TouchableOpacity style={s.retryBtn} onPress={this.handleRetry}>
            <RefreshCw size={20} color={Colors.white} />
            <Text style={s.retryText}>{t?.('tryAgain') || 'Try Again'}</Text>
          </TouchableOpacity>

          <View style={s.debugBox}>
            <Text style={s.debugTitle}>Debug Info:</Text>
            <Text style={s.debugText}>{this.state.error?.toString()}</Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(199,31,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  retryBtn: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
      web: { boxShadow: `0 4px 12px ${Colors.primary}66` } as unknown as ViewStyle,
    }),
  },
  retryText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  debugBox: {
    marginTop: 40,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: Radius.md,
    width: '100%',
  },
  debugTitle: {
    color: '#ff4d4d',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  debugText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
