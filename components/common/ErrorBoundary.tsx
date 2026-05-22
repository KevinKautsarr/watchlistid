import React, { ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors, Radius, FontSize, FontWeight } from '@/constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji} allowFontScaling={false}>🎬</Text>
          <Text style={styles.title} allowFontScaling={false}>Ups, Ada Kesalahan</Text>
          <Text style={styles.subtitle} allowFontScaling={false}>
            Aplikasi mengalami kendala saat memuat halaman ini.
          </Text>
          <View style={styles.debugBox}>
            <Text style={styles.debugText} allowFontScaling={false}>
              {this.state.error?.toString()}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.retryBtn} 
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retry} allowFontScaling={false}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 32,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  retry: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.lg,
  },
  debugBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: Colors.overlay.red10,
    borderRadius: Radius.md,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.overlay.red20,
  },
  debugText: {
    color: Colors.text.accent,
    fontSize: FontSize.xs,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    textAlign: 'center',
  }
});

export default ErrorBoundary;
