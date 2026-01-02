import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react-native';

// Custom toast configuration
export const toastConfig: ToastConfig = {
  success: (props) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <CheckCircle size={20} color="#10B981" />
      <View style={styles.textContainer}>
        <Text style={styles.toastTitle}>{props.text1}</Text>
        {props.text2 && <Text style={styles.toastMessage}>{props.text2}</Text>}
      </View>
    </View>
  ),
  error: (props) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <XCircle size={20} color="#EF4444" />
      <View style={styles.textContainer}>
        <Text style={styles.toastTitle}>{props.text1}</Text>
        {props.text2 && <Text style={styles.toastMessage}>{props.text2}</Text>}
      </View>
    </View>
  ),
  info: (props) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <AlertCircle size={20} color="#3B82F6" />
      <View style={styles.textContainer}>
        <Text style={styles.toastTitle}>{props.text1}</Text>
        {props.text2 && <Text style={styles.toastMessage}>{props.text2}</Text>}
      </View>
    </View>
  ),
  xpEarned: (props) => (
    <View style={[styles.toastContainer, styles.xpToast]}>
      <Zap size={20} color="#F59E0B" fill="#F59E0B" />
      <View style={styles.textContainer}>
        <Text style={styles.toastTitle}>{props.text1}</Text>
        {props.text2 && <Text style={[styles.toastMessage, { color: '#92400E' }]}>{props.text2}</Text>}
      </View>
    </View>
  ),
};

// Toast helper functions
export const showSuccessToast = (title: string, message?: string) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

export const showErrorToast = (title: string, message?: string) => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
  });
};

export const showInfoToast = (title: string, message?: string) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

export const showXPToast = (xpAmount: number, domain?: string) => {
  Toast.show({
    type: 'xpEarned',
    text1: `+${xpAmount} XP earned!`,
    text2: domain ? `Added to ${domain}` : 'Keep going!',
    position: 'top',
    visibilityTime: 3000,
  });
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  successToast: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  errorToast: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  infoToast: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  xpToast: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  toastMessage: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default Toast;
