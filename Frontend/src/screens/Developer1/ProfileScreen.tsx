import React, {useContext, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  softBorderColors,
  SOFT_BORDER_END,
  SOFT_BORDER_START,
} from '../../utils/softBorder';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {MainTabParamList} from '../../navigation/types';
import {AuthContext} from '../../context/AuthContext';

type ProfileScreenProps = {
  navigation: BottomTabScreenProps<MainTabParamList, 'Profile'>['navigation'];
};

const FONT = {
  regular: 'CarmenSans-Regular',
  medium: 'CarmenSans-Medium',
  bold: 'CarmenSans-Bold',
  semiBold: 'CarmenSans-SemiBold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

export default function ProfileScreen(_props: ProfileScreenProps) {
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const initials = useMemo(() => {
    const name = (user?.username || user?.email || '?').trim();
    return name.slice(0, 1).toUpperCase();
  }, [user?.username, user?.email]);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          if (!auth?.logout) {
            return;
          }
          void auth.logout().catch(() => {
            Alert.alert('Error', 'Could not log out. Please try again.');
          });
        },
      },
    ]);
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

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#FFFFFF', 'rgba(255,255,255,0.72)']}
              style={styles.headerCard}>
              <Text style={styles.kicker}>Account</Text>
              <Text style={styles.title}>Your Profile</Text>
              <Text style={styles.subtitle}>
                View your account details and sign out when you are done
              </Text>
            </LinearGradient>
          </View>

          {!user ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Not logged in</Text>
              <Text style={styles.emptyText}>
                Sign in to see your profile information here.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.hero}>
                <LinearGradient
                  colors={['#459fff', '#64B5F6']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.avatarRing}>
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                </LinearGradient>
                <Text style={styles.userName}>{user.username}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>

              <Text style={styles.sectionLabel}>Account details</Text>
              <LinearGradient
                  colors={softBorderColors('#459fff')}
                start={SOFT_BORDER_START}
                end={SOFT_BORDER_END}
                  style={styles.borderShell}>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Username</Text>
                    <Text style={styles.value}>{user.username}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user.email}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>User ID</Text>
                    <Text style={styles.value}>{String(user.id)}</Text>
                  </View>
                </View>
              </LinearGradient>

              <TouchableOpacity
                onPress={handleLogout}
                activeOpacity={0.88}
                style={styles.logoutWrap}>
                <LinearGradient
                  pointerEvents="none"
                  colors={['#FF6B6B', '#FF8C42']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.logoutBtn}>
                  <Text style={styles.logoutBtnText}>Log out</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

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
  scrollContent: {
    padding: 16,
    paddingBottom: 130,
  },
  header: {
    marginBottom: 22,
  },
  headerCard: {
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    shadowColor: '#459fff',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#459fff',
    fontFamily: FONT.bold,
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 30,
    color: '#1A2B4C',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: FONT.extraBold,
  },
  subtitle: {
    fontSize: 14,
    color: '#5A6D88',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONT.medium,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    padding: 3,
    marginBottom: 14,
    shadowColor: '#459fff',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 49,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: '#459fff',
    fontFamily: FONT.extraBold,
  },
  userName: {
    fontSize: 22,
    color: '#1A2B4C',
    fontFamily: FONT.extraBold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#5A6D88',
    fontFamily: FONT.medium,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#7A8BA3',
    fontFamily: FONT.bold,
    marginBottom: 10,
    marginLeft: 4,
  },
  borderShell: {
    borderRadius: 22,
    padding: 1.5,
    marginBottom: 20,
    shadowColor: '#1A2B4C',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(69,159,255,0.12)',
  },
  label: {
    fontSize: 15,
    color: '#1A2B4C',
    fontFamily: FONT.semiBold,
  },
  value: {
    flexShrink: 1,
    fontSize: 15,
    color: '#5A6D88',
    fontFamily: FONT.regular,
    textAlign: 'right',
  },
  logoutWrap: {
    marginTop: 4,
  },
  logoutBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    color: '#1A2B4C',
    fontFamily: FONT.bold,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#5A6D88',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONT.medium,
  },
});
