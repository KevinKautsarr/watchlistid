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

class ErrorBoundary extends React.Component<Props, State> {
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
          <Text style={styles.emoji}>😕</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>Our cinematic experience hit a snag.</Text>
          <View style={styles.debugBox}>
            <Text style={styles.debugText}>{this.state.error?.toString()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.retryBtn} 
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retry}>Try Again</Text>
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
    color: Colors.dark,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.primary,
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
    color: Colors.background,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.lg,
  },
  debugBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8d7da',
    borderRadius: 5,
    width: '100%',
  },
  debugText: {
    color: '#721c24',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  }
});

export default ErrorBoundary;
