import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ViewStyle } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

interface Props {
  children: ReactNode;
  screenName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ScreenErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in screen [${this.props.screenName || 'Unknown'}]:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <View style={s.iconBox}>
            <AlertTriangle size={48} color={Colors.primary} />
          </View>
          
          <Text style={s.title}>Waduh, ada kendala!</Text>
          <Text style={s.message}>
            Terjadi kesalahan saat memuat {this.props.screenName || 'halaman'} ini. 
            Coba muat ulang atau hubungi tim support jika kendala berlanjut.
          </Text>

          <TouchableOpacity style={s.retryBtn} onPress={this.handleRetry}>
            <RefreshCw size={20} color={Colors.white} />
            <Text style={s.retryText}>Coba Lagi</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <View style={s.debugBox}>
              <Text style={s.debugTitle}>Debug Info:</Text>
              <Text style={s.debugText}>{this.state.error?.toString()}</Text>
            </View>
          )}
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
    backgroundColor: 'rgba(229,9,20,0.1)',
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
