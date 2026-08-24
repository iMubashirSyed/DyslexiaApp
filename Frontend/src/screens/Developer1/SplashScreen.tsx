import React, { useState, useEffect, useRef,useCallback  } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image, Animated, Easing
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

import Svg, { Circle, Path } from 'react-native-svg';

import { useNavigation } from '@react-navigation/native';

type SplashScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};




export default function SplashScreen({ navigation }: SplashScreenProps) {

    useFocusEffect(
        useCallback(() => {
            
            // Set timeout when screen comes into view
            const timer = setTimeout(() => {
                setScreenState(1);
            }, 5000); // 5 seconds

            // Cleanup: Clear timeout if screen loses focus before timeout finishes
            return () => {
                clearTimeout(timer);
                console.log('Timeout cleared');
            };
        }, [])
    );


    let percentage = 30;
    const size = 60;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const [screenState, setScreenState] = useState(0); // 'splash' or 'home'

    const [progress, setProgress] = useState(33.3);
    const strokeDashoffset =
        circumference - (circumference * progress) / 100;

    const handleProgress = () => {
        // Simulate progress update
        if (screenState >= 3) {
            navigation.replace('Auth');
            setProgress(33.3);
        }
        else {
            setScreenState(prev => prev + 1);
        }
        // Switch to 'home' screen after progress update


        const newProgress = (progress + 33.3) % 110;
        setProgress(newProgress);
        console.log(`Progress: ${newProgress}%`);
    }
    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(30);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),
        ]).start();
    }, [screenState]);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>


                {screenState === 0 && (
                    <View

                        style={[styles.mainView, { backgroundColor: '#459fff' }]}
                    >

                        <View style={styles.mainInnerView}>
                            <Image
                                source={require('../../../assets/images/main_Icon.jpg')}
                                style={styles.mainIcon}></Image>

                            <Text style={styles.mainText}>
                                Welcome to All in One Dyslexia Learning App
                            </Text>
                        </View>

                    </View>)}
                {screenState === 1 && (
                    <LinearGradient

                        style={styles.mainView}
                        colors={['#FFFFFF', '#ffffff', '#c6d6f3']}
                        start={{ x: 1, y: 1 }}
                        end={{ x: 0, y: 0 }}>

                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }}>
                            <Image
                                source={require('../../../assets/images/splashscreen1.png')}
                                style={styles.imageStyle}></Image>
                        </Animated.View>
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }}
                        >
                            <View style={styles.textWrapper}>
                                <Text style={styles.textStyle}>
                                    Every mind learns{' '}
                                </Text>

                                <View style={styles.underlineContainer}>
                                    <Text style={styles.textStyletwo}>
                                        differently
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>

                        <TouchableOpacity onPress={handleProgress} style={styles.progressCircleContainer}>
                            {/* Container with position relative for absolute positioning */}
                            <View style={styles.circleContainer}>
                                {/* SVG Circle */}
                                <Svg width={size} height={size}>
                                    {/* Background Circle */}
                                    <Circle
                                        stroke="#dfdfdf"
                                        fill="none"
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        strokeWidth={strokeWidth}
                                    />
                                    {/* Progress Circle */}
                                    <Circle
                                        stroke="#459fff"
                                        fill="none"
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                    />
                                </Svg>

                                {/* Icon overlaid on top of circle */}
                                <View style={styles.iconOverlay}>
                                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                        <Path
                                            d="M3 12h15"
                                            stroke={'#000'}
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        {/* Arrowhead - Color 2 */}
                                        <Path
                                            d="M14 5l7 7-7 7"
                                            stroke={'#459fff'}
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </Svg>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>)}


                {screenState === 2 && (
                    <LinearGradient

                        style={styles.mainView}
                        colors={['#FFFFFF', '#ffffff', '#c6d6f3']}
                        start={{ x: 1, y: 1 }}
                        end={{ x: 0, y: 0 }}>
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }}>
                            <Image
                                source={require('../../../assets/images/splashscreen2.png')}
                                style={styles.imageStyle}></Image>
                        </Animated.View>

                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }}
                        >

                            <View style={styles.textWrapper}>
                                <Text style={styles.textStyle}>
                                    Learning Made{' '}
                                </Text>


                                <View style={styles.underlineContainer}>
                                    <Text style={styles.textStyletwo}>
                                        Colorful
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                        <TouchableOpacity onPress={handleProgress} style={styles.progressCircleContainer}>
                            {/* Container with position relative for absolute positioning */}
                            <View style={styles.circleContainer}>
                                {/* SVG Circle */}
                                <Svg width={size} height={size}>
                                    {/* Background Circle */}
                                    <Circle
                                        stroke="#dfdfdf"
                                        fill="none"
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        strokeWidth={strokeWidth}
                                    />
                                    {/* Progress Circle */}
                                    <Circle
                                        stroke="#459fff"
                                        fill="none"
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                    />
                                </Svg>

                                {/* Icon overlaid on top of circle */}
                                <View style={styles.iconOverlay}>
                                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                        <Path
                                            d="M3 12h15"
                                            stroke={'#000'}
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        {/* Arrowhead - Color 2 */}
                                        <Path
                                            d="M14 5l7 7-7 7"
                                            stroke={'#459fff'}
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </Svg>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>)}

                {screenState === 3 && (
                    <LinearGradient

                        style={styles.mainView}
                        colors={['#FFFFFF', '#ffffff', '#c6d6f3']}
                        start={{ x: 1, y: 1 }}
                        end={{ x: 0, y: 0 }}>

                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }}
                        >
                            <Image
                                source={require('../../../assets/images/splashscreen3.png')}
                                style={{
                                    width: '100%',
                                    height: 400,
                                    objectFit: 'contain',
                                    marginLeft: -28,
                                    marginTop: 2
                                }}></Image>
                        </Animated.View>


                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }}
                        >

                            <View style={styles.textWrapper}>
                                <Text style={styles.textStyle}>
                                    Learning through{' '}
                                </Text>


                                <View style={styles.underlineContainer}>
                                    <Text style={styles.textStyletwo}>
                                        Artificial Intelligence
                                    </Text>
                                </View>
                            </View>



                        </Animated.View>

                        <TouchableOpacity onPress={handleProgress} style={styles.progressCircleContainer}>
                            {/* Container with position relative for absolute positioning */}
                            <View style={styles.circleContainer}>
                                {/* SVG Circle */}
                                <Svg width={size} height={size}>
                                    {/* Background Circle */}
                                    <Circle
                                        stroke="#dfdfdf"
                                        fill="none"
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        strokeWidth={strokeWidth}
                                    />
                                    {/* Progress Circle */}
                                    <Circle
                                        stroke="#459fff"
                                        fill="none"
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                    />
                                </Svg>

                                {/* Icon overlaid on top of circle */}
                                <View style={styles.iconOverlay}>
                                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                        <Path
                                            d="M3 12h15"
                                            stroke={'#000'}
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        {/* Arrowhead - Color 2 */}
                                        <Path
                                            d="M14 5l7 7-7 7"
                                            stroke={'#459fff'}
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </Svg>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>)}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 0,
        flexGrow: 1,
    },

    mainView: {
        flex: 1,
    },
    mainInnerView: {
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flex: 1
    },
    mainIcon: {

        width: 150,
        height: 150,
        objectFit: 'contain',
        borderWidth: 3,
        borderColor: 'white',
        borderRadius: 20

    },

    mainText: {
        fontSize: 26,
        textAlign: 'center',
        marginTop: 15,
        lineHeight: 30,
        color: 'white',
        fontFamily: 'CarmenSans-Bold'
        
    },
    imageStyle: {
        width: '100%',
        height: 400,
        objectFit: 'contain',
        marginLeft: 13,
        marginTop: 2,
    },
    textStyle: {
        fontSize: 28,
        textAlign: 'left',
        marginTop: 10,
        paddingStart: 30,
        lineHeight: 30,
        fontFamily:"CarmenSans-Bold"
    },

    textStyletwo: {
        marginTop: 10,
        fontSize: 22,
      
        lineHeight: 28,
        includeFontPadding: false,
        fontFamily:"CarmenSans-Bold"
    },

    textWrapper: {
        paddingStart: 0,
        marginTop: 15,
    },

    underlineContainer: {
        borderBottomWidth: 3,
        borderBottomColor: '#459fff',
        alignSelf: 'flex-start',
        paddingBottom: 0,
        marginLeft: 30,
    },

    progressCircleContainer: {
        position: 'absolute',
        bottom: 15,
        right: 20,
    },

    // NEW: Container for relative positioning
    circleContainer: {
        position: 'relative',
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // NEW: Icon positioned absolutely on top of circle
    iconOverlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
});