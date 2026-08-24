import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {AuthContext} from '../../context/AuthContext';
import apiClient from '../../api/client';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

function EyeIcon({
  visible,
  color = '#7A8BA3',
  size = 22,
}: {
  visible: boolean;
  color?: string;
  size?: number;
}) {
  if (visible) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
          stroke={color}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.75} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.12 14.12a3 3 0 1 1-4.24-4.24"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 1l22 22"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const AuthScreen = () => {
  const auth = useContext(AuthContext);

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        await auth?.login(email, password);
      } else {
        await apiClient.post('register/', {
          username,
          email,
          password,
          password2,
        });

        Alert.alert('Success', 'Account created. Please login.');
        setIsLogin(true);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Authentication failed');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#E8F4FF', '#FFF5EB', '#F7FBFF']}
        locations={[0, 0.45, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(69,159,255,0.22)', 'rgba(69,159,255,0)']}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={['rgba(255,140,66,0.18)', 'rgba(255,140,66,0)']}
        style={styles.blobBottom}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.mainView}>
          <View style={styles.card}>
            <Text style={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</Text>

            {!isLogin && (
              <TextInput
                placeholder="Username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#7A8BA3"
              />
            )}

            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#7A8BA3"
            />

            <View style={styles.passwordWrap}>
              <TextInput
                placeholder="Password"
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#7A8BA3"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(prev => !prev)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? 'Hide password' : 'Show password'
                }
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <EyeIcon visible={showPassword} />
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <View style={styles.passwordWrap}>
                <TextInput
                  placeholder="Confirm Password"
                  secureTextEntry={!showPassword2}
                  style={styles.passwordInput}
                  value={password2}
                  onChangeText={setPassword2}
                  placeholderTextColor="#7A8BA3"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword2(prev => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword2
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <EyeIcon visible={showPassword2} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>
                {isLogin ? 'Login' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7FBFF',
  },
  safe: {
    flex: 1,
  },
  blobTop: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  blobBottom: {
    position: 'absolute',
    bottom: 80,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  mainView: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    padding: 25,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#459fff',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1A2B4C',
    fontFamily: 'CarmenSans-Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(69,159,255,0.18)',
    backgroundColor: '#F7FBFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#1A2B4C',
    fontFamily: 'CarmenSans-Regular',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(69,159,255,0.18)',
    backgroundColor: '#F7FBFF',
    borderRadius: 12,
    marginBottom: 15,
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    fontSize: 16,
    color: '#1A2B4C',
    fontFamily: 'CarmenSans-Regular',
  },
  eyeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#459fff',
    padding: 15,
    borderRadius: 14,
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'CarmenSans-Medium',
  },
  switchText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#459fff',
    fontSize: 14,
    fontFamily: 'CarmenSans-Regular',
  },
});
