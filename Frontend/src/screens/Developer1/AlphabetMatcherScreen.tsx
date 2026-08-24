import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    ActivityIndicator,
    Animated,
    Image,
    ImageSourcePropType,
    PanResponder,
    PanResponderGestureState,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  softBorderColors,
  SOFT_BORDER_END,
  SOFT_BORDER_START,
} from '../../utils/softBorder';
import Tts from 'react-native-tts';

import { useNavigation } from '@react-navigation/native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthContext } from '../../context/AuthContext';
import { FeatureIcon } from './FeatureIcons';

// Level 1
import boatImage from '../../../assets/images/alphamatch/Boat.jpg';
import doorImage from '../../../assets/images/alphamatch/Door.jpg';
import bedImage from '../../../assets/images/alphamatch/Bed.jpg';
import dollImage from '../../../assets/images/alphamatch/Doll.jpg';
import dogImage from '../../../assets/images/alphamatch/Dog.jpg';
import batImage from '../../../assets/images/alphamatch/Bat.jpg';

// level 2
import penImage from '../../../assets/images/alphamatch/Pen.jpg';
import pizzaImage from '../../../assets/images/alphamatch/Pizza.jpg';
import panImage from '../../../assets/images/alphamatch/Pan.jpg';
import quiltImage from '../../../assets/images/alphamatch/Quilt.jpg';
import quailImage from '../../../assets/images/alphamatch/Quail.jpg';
import queenImage from '../../../assets/images/alphamatch/Queen.jpg';
// level 3
import nestImage from '../../../assets/images/alphamatch/Nest.jpg';
import noseImage from '../../../assets/images/alphamatch/Nose.jpg';
import netImage from '../../../assets/images/alphamatch/Net.jpg';
import hatImage from '../../../assets/images/alphamatch/Hat.jpg';
import henImage from '../../../assets/images/alphamatch/Hen.jpg';
import handImage from '../../../assets/images/alphamatch/Hand.jpg';

// level 4
import watchImage from '../../../assets/images/alphamatch/Watch.png';
import waterImage from '../../../assets/images/alphamatch/Water.png';
import wolfImage from '../../../assets/images/alphamatch/Wolf.png';
import manImage from '../../../assets/images/alphamatch/Man.png';
import moonImage from '../../../assets/images/alphamatch/Moon.png';
import milkImage from '../../../assets/images/alphamatch/Milk.png';

// level 5
import fanImage from '../../../assets/images/alphamatch/Fan.png';
import fishImage from '../../../assets/images/alphamatch/Fish.png';
import frogImage from '../../../assets/images/alphamatch/Frog.png';
import toyImage from '../../../assets/images/alphamatch/Toy.png';
import treeImage from '../../../assets/images/alphamatch/Tree.png';
import tigerImage from '../../../assets/images/alphamatch/Tiger.png';

// level 6
import nailImage from '../../../assets/images/alphamatch/Nail.png';
import nurseImage from '../../../assets/images/alphamatch/Nurse.png';
import neckImage from '../../../assets/images/alphamatch/Neck.png';
import umbrellaImage from '../../../assets/images/alphamatch/Umbrella.png';
import unicornImage from '../../../assets/images/alphamatch/Unicorn.png';
import uniformImage from '../../../assets/images/alphamatch/Uniform.png';

// level 7
import forkImage from '../../../assets/images/alphamatch/Fork.png';
import farmImage from '../../../assets/images/alphamatch/Farm.png';
import flagImage from '../../../assets/images/alphamatch/Flag.png';
import jamImage from '../../../assets/images/alphamatch/Jam.png';
import jarImage from '../../../assets/images/alphamatch/Jar.png';
import juiceImage from '../../../assets/images/alphamatch/Juice.png';

// level 8
import sunImage from '../../../assets/images/alphamatch/Sun.png';
import sockImage from '../../../assets/images/alphamatch/Sock.png';
import snakeImage from '../../../assets/images/alphamatch/Snake.png';
import zooImage from '../../../assets/images/alphamatch/Zoo.png';
import zipImage from '../../../assets/images/alphamatch/zip.png';
import zeroImage from '../../../assets/images/alphamatch/Zero.png';

import levelIcon1 from '../../../assets/images/alphamatch/levelIcon/level_1.png';
import levelIcon2 from '../../../assets/images/alphamatch/levelIcon/level_2.png';
import levelIcon3 from '../../../assets/images/alphamatch/levelIcon/level_3.png';
import levelIcon4 from '../../../assets/images/alphamatch/levelIcon/level_4.png';
import levelIcon5 from '../../../assets/images/alphamatch/levelIcon/level_5.png';
import levelIcon6 from '../../../assets/images/alphamatch/levelIcon/level_6.png';
import levelIcon7 from '../../../assets/images/alphamatch/levelIcon/level_7.png';
import levelIcon8 from '../../../assets/images/alphamatch/levelIcon/level_8.png';

const LEVEL_ICONS: ImageSourcePropType[] = [
    levelIcon1,
    levelIcon2,
    levelIcon3,
    levelIcon4,
    levelIcon5,
    levelIcon6,
    levelIcon7,
    levelIcon8,
];

type LevelWord = {
    word: string;
    alpha: string;
    image: ImageSourcePropType | string;
};

type LevelConfig = {
    level: number;
    words: LevelWord[];
};

type WordStatus = 'idle' | 'wrong' | 'correct';

type WordItem = LevelWord & {
    id: string;
    matched: boolean;
    filledAlpha: string;
    status: WordStatus;
    shake: Animated.Value;
};

type TrayItem = {
    id: string;
    letter: string;
    used: boolean;
};

const LEVELS: LevelConfig[] = [
    {
        level: 1,
        words: [
            { word: 'Bed', alpha: 'b', image: bedImage },
            { word: 'Boat', alpha: 'b', image: boatImage },
            { word: 'Bat', alpha: 'b', image: batImage },
            { word: 'Dog', alpha: 'd', image: dogImage },
            { word: 'Doll', alpha: 'd', image: dollImage },
            { word: 'Door', alpha: 'd', image: doorImage },
        ],
    },
    {
        level: 2,
        words: [
            { word: 'Pen', alpha: 'p', image: penImage },
            { word: 'Pizza', alpha: 'p', image: pizzaImage },
            { word: 'Pan', alpha: 'p', image: panImage },
            { word: 'Queen', alpha: 'q', image: queenImage },
            { word: 'Quilt', alpha: 'q', image: quiltImage },
            { word: 'Quail', alpha: 'q', image: quailImage },
        ],
    },
    {
        level: 3,
        words: [
            { word: 'Nest', alpha: 'n', image: nestImage },
            { word: 'Nose', alpha: 'n', image: noseImage },
            { word: 'Net', alpha: 'n', image: netImage },
            { word: 'Hat', alpha: 'h', image: hatImage },
            { word: 'Hen', alpha: 'h', image: henImage },
            { word: 'Hand', alpha: 'h', image: handImage },
        ],
    },
    {
        level: 4,
        words: [
            { word: 'Watch', alpha: 'w', image: watchImage },
            { word: 'Water', alpha: 'w', image: waterImage },
            { word: 'Wolf', alpha: 'w', image: wolfImage },
            { word: 'Man', alpha: 'm', image: manImage },
            { word: 'Moon', alpha: 'm', image: moonImage },
            { word: 'Milk', alpha: 'm', image: milkImage },
        ],
    },
    {
        level: 5,
        words: [
                    { word: 'Fan', alpha: 'f', image: fanImage },
            { word: 'Fish', alpha: 'f', image: fishImage },
            { word: 'Frog', alpha: 'f', image: frogImage },
            { word: 'Toy', alpha: 't', image: toyImage },
            { word: 'Tree', alpha: 't', image: treeImage },
            { word: 'Tiger', alpha: 't', image: tigerImage },
        ],
    },
    {
        level: 6,
        words: [
            { word: 'Nail', alpha: 'n', image: nailImage },
            { word: 'Nurse', alpha: 'n', image: nurseImage },
            { word: 'Neck', alpha: 'n', image: neckImage },
            { word: 'Umbrella', alpha: 'u', image: umbrellaImage },
            { word: 'Unicorn', alpha: 'u', image: unicornImage },
            { word: 'Uniform', alpha: 'u', image: uniformImage },
        ],
    },
    {
        level: 7,
        words: [
            { word: 'Fork', alpha: 'f', image: forkImage },
            { word: 'Farm', alpha: 'f', image: farmImage },
            { word: 'Flag', alpha: 'f', image: flagImage },
            { word: 'Jam', alpha: 'j', image: jamImage },
            { word: 'Jar', alpha: 'j', image: jarImage },
            { word: 'Juice', alpha: 'j', image: juiceImage },
        ],
    },
    {
        level: 8,
        words: [
            { word: 'Sun', alpha: 's', image: sunImage },
            { word: 'Sock', alpha: 's', image: sockImage },
            { word: 'Snake', alpha: 's', image: snakeImage },
            { word: 'Zoo', alpha: 'z', image: zooImage },
            { word: 'Zip', alpha: 'z', image: zipImage },
            { word: 'Zero', alpha: 'z', image: zeroImage },
        ],
    },
];

const shuffle = <T,>(items: T[]): T[] => {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
    }
    return next;
};

const buildLevelState = (levelIndex: number) => {
    const level = LEVELS[levelIndex];

    const words: WordItem[] = shuffle(level.words).map((item, index) => ({
        ...item,
        id: `${level.level}-word-${index}`,
        matched: false,
        filledAlpha: '',
        status: 'idle',
        shake: new Animated.Value(0),
    }));

    const tray: TrayItem[] = shuffle(level.words.map(item => item.alpha)).map(
        (letter, index) => ({
            id: `${level.level}-tray-${index}`,
            letter,
            used: false,
        }),
    );

    return { words, tray };
};

type DraggableLetterProps = {
    item: TrayItem;
    onDrop: (trayId: string, letter: string, moveX: number, moveY: number) => void;
};

function DraggableLetter({ item, onDrop }: DraggableLetterProps) {
    const pan = useMemo(() => new Animated.ValueXY(), []);

    const responder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => !item.used,
                onMoveShouldSetPanResponder: () => !item.used,
                onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
                    useNativeDriver: false,
                }),
                onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
                    onDrop(item.id, item.letter, gestureState.moveX, gestureState.moveY);
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false,
                    }).start();
                },
            }),
        [item.id, item.letter, item.used, onDrop, pan],
    );

    return (
        <Animated.View
            {...responder.panHandlers}
            style={[
                styles.letterChipWrap,
                item.used && styles.usedLetterChip,
                { transform: pan.getTranslateTransform() },
            ]}>
            <LinearGradient
                colors={item.used ? ['#B0BEC5', '#90A4AE'] : ['#459fff', '#2f80ed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.letterChip}>
                <Text style={styles.letterText}>{item.letter}</Text>
            </LinearGradient>
        </Animated.View>
    );
}

export default function AlphabetMatcherScreen() {
    const auth = useContext(AuthContext);
    const [levelIndex, setLevelIndex] = useState(0);
    const [state, setState] = useState(() => buildLevelState(0));
    const [highlightedWord, setHighlightedWord] = useState<LevelWord | null>(null);
    const hasInitializedLevel = useRef(false);
    const [slotLayouts, setSlotLayouts] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
    const wordRefs = useRef<Record<string, View | null>>({});

    const currentLevel = LEVELS[levelIndex];
    const allMatched = state.words.every(item => item.matched);

    useEffect(() => {
        Tts.setDefaultRate(0.5);
        Tts.setDefaultPitch(1);

        return () => {
            Tts.stop();
        };
    }, []);

    const speakWord = useCallback((word: string) => {
        Tts.stop();
        Tts.speak(word, {
            iosVoiceId: 'com.apple.ttsbundle.default',
            rate: 0.5,
            androidParams: {
                KEY_PARAM_STREAM: 'STREAM_MUSIC', // uses media volume buttons
                KEY_PARAM_VOLUME: 1.0,            // 0.0 to 1.0
                KEY_PARAM_PAN: 0,                 // center
            },
        });
        AccessibilityInfo.announceForAccessibility(word);
    }, []);

    const setWrongAndShake = useCallback((wordId: string) => {
        setState(prev => ({
            ...prev,
            words: prev.words.map(word =>
                word.id === wordId ? { ...word, status: 'wrong' } : word,
            ),
        }));

        const currentWord = state.words.find(word => word.id === wordId);
        if (!currentWord) {
            return;
        }

        Animated.sequence([
            Animated.timing(currentWord.shake, {
                toValue: 12,
                duration: 70,
                useNativeDriver: true,
            }),
            Animated.timing(currentWord.shake, {
                toValue: -12,
                duration: 70,
                useNativeDriver: true,
            }),
            Animated.timing(currentWord.shake, {
                toValue: 8,
                duration: 60,
                useNativeDriver: true,
            }),
            Animated.timing(currentWord.shake, {
                toValue: 0,
                duration: 60,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setState(prev => ({
                ...prev,
                words: prev.words.map(word =>
                    word.id === wordId && !word.matched ? { ...word, status: 'idle' } : word,
                ),
            }));
        });
    }, [state.words]);

    const handleDrop = useCallback(
        (trayId: string, letter: string, moveX: number, moveY: number) => {
            const targetWord = state.words.find(word => {
                const slot = slotLayouts[word.id];
                if (!slot) {
                    return false;
                }

                return (
                    moveX >= slot.x &&
                    moveX <= slot.x + slot.width &&
                    moveY >= slot.y &&
                    moveY <= slot.y + slot.height
                );
            });

            if (!targetWord || targetWord.matched) {
                return;
            }

            if (targetWord.alpha.toLowerCase() === letter.toLowerCase()) {
                const spokenWord = targetWord.word;
                setState(prev => ({
                    words: prev.words.map(word =>
                        word.id === targetWord.id
                            ? {
                                ...word,
                                matched: true,
                                filledAlpha: letter,
                                status: 'correct',
                            }
                            : word,
                    ),
                    tray: prev.tray.map(item =>
                        item.id === trayId ? { ...item, used: true } : item,
                    ),
                }));
                setHighlightedWord(targetWord);
                speakWord(spokenWord);
            } else {
                setWrongAndShake(targetWord.id);
            }
        },
        [setWrongAndShake, slotLayouts, speakWord, state.words],
    );

    const resetLevel = useCallback((nextLevelIndex: number) => {
        setLevelIndex(nextLevelIndex);
        setState(buildLevelState(nextLevelIndex));
        setHighlightedWord(null);
        setSlotLayouts({});
    }, []);

    useEffect(() => {
        hasInitializedLevel.current = false;
    }, [auth?.user?.id]);

    useEffect(() => {
        if (!auth?.alphabetMatcherLevelReady) {
            return;
        }
        if (hasInitializedLevel.current) {
            return;
        }
        hasInitializedLevel.current = true;
        const idx = Math.min(
            Math.max((auth?.alphabetMatcherLevel ?? 1) - 1, 0),
            LEVELS.length - 1,
        );
        setLevelIndex(idx);
        setState(buildLevelState(idx));
        setHighlightedWord(null);
        setSlotLayouts({});
    }, [
        auth?.alphabetMatcherLevel,
        auth?.alphabetMatcherLevelReady,
        auth?.user?.id,
    ]);

    const goToNextLevel = useCallback(async () => {
        const nextIndex = levelIndex + 1;
        const nextLevelNumber = LEVELS[nextIndex].level;
        resetLevel(nextIndex);
        if (auth?.user) {
            await auth.saveAlphabetMatcherLevel(nextLevelNumber);
        }
    }, [auth, levelIndex, resetLevel]);

    /** Window coords go stale after ScrollView scroll — onLayout does not re-fire. */
    const remeasureAllWordSlots = useCallback(() => {
        const targets = state.words
            .map(w => ({ id: w.id, ref: wordRefs.current[w.id] }))
            .filter((t): t is { id: string; ref: View } => t.ref != null);

        if (targets.length === 0) {
            return;
        }

        let remaining = targets.length;
        const updates: Record<string, { x: number; y: number; width: number; height: number }> =
            {};

        targets.forEach(({ id, ref }) => {
            ref.measureInWindow((x, y, width, height) => {
                updates[id] = { x, y, width, height };
                remaining -= 1;
                if (remaining === 0) {
                    setSlotLayouts(prev => ({ ...prev, ...updates }));
                }
            });
        });
    }, [state.words]);

    const onWordLayout = useCallback(() => {
        requestAnimationFrame(() => {
            remeasureAllWordSlots();
        });
    }, [remeasureAllWordSlots]);

    const showHelp = () => {
        Alert.alert(
            'Alphabet Matcher',
            'Match the word to the image by dragging the letters to the correct position.',
        );
    };

    const navigation = useNavigation();

    if (auth?.user && !auth.alphabetMatcherLevelReady) {
        return (
            <View style={styles.root}>
                <LinearGradient
                    colors={['#E8F4FF', '#FFF5EB', '#F7FBFF']}
                    style={StyleSheet.absoluteFill}
                />
                <SafeAreaView style={[styles.safe, styles.loadingWrap]} edges={['left', 'right']}>
                    <ActivityIndicator size="large" color="#459fff" />
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <LinearGradient
                colors={['#E8F4FF', '#FFF5EB', '#F7FBFF']}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
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
                <View style={styles.headerPad}>
                    <LinearGradient
                        colors={['#FFFFFF', 'rgba(255,255,255,0.72)']}
                        style={styles.headerCard}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.headerBtn}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel="Go back">
                            <LinearGradient
                                colors={['#459fff', '#64B5F6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.headerBtnGrad}>
                                <Text style={styles.headerBtnText}>‹</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                Alphabet Matcher
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={showHelp}
                            style={styles.headerBtn}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel="Help">
                            <LinearGradient
                                colors={['#FF8C42', '#FFB88C']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.headerBtnGrad}>
                                <Text style={styles.headerBtnText}>?</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    onMomentumScrollEnd={remeasureAllWordSlots}
                    onScrollEndDrag={remeasureAllWordSlots}
                    onContentSizeChange={remeasureAllWordSlots}>

                    <LinearGradient
                        colors={['#FFFFFF', 'rgba(255,255,255,0.75)']}
                        style={styles.levelBanner}>
                        <LinearGradient
                            colors={['#FF8C42', '#FF6B6B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.levelIconChip}>
                            {LEVEL_ICONS[levelIndex] ? (
                                <Image
                                    source={LEVEL_ICONS[levelIndex]}
                                    style={styles.levelIcon}
                                    resizeMode="contain"
                                    accessibilityIgnoresInvertColors
                                    accessibilityLabel={`Level ${currentLevel.level} badge`}
                                />
                            ) : (
                                <FeatureIcon name="alphabet" color="#FFFFFF" size={16} />
                            )}
                        </LinearGradient>
                        <View style={styles.levelTextBlock}>
                            <Text style={styles.levelKicker}>Progress</Text>
                            <Text style={styles.levelDot}>·</Text>
                            <Text style={styles.subtitle}>Level {currentLevel.level}</Text>
                        </View>
                    </LinearGradient>

                    <Text style={styles.sectionLabel}>Match the missing letter</Text>
                    <View style={styles.wordsGrid}>
                        {state.words.map(item => {
                            const fullWord = `${item.filledAlpha || '_'}${item.word.slice(1)}`;
                            const borderColors: [string, string] =
                                item.status === 'correct'
                                    ? softBorderColors('#43E97B')
                                    : item.status === 'wrong'
                                      ? softBorderColors('#FF6B6B')
                                      : softBorderColors('#459fff');
                            return (
                                <Animated.View
                                    key={item.id}
                                    ref={ref => {
                                        wordRefs.current[item.id] = ref;
                                    }}
                                    collapsable={false}
                                    onLayout={onWordLayout}
                                    style={[
                                        styles.wordCardShell,
                                        { transform: [{ translateX: item.shake }] },
                                    ]}>
                                    <LinearGradient
                  colors={borderColors}
                                        start={SOFT_BORDER_START}
                                        end={SOFT_BORDER_END}
                  style={styles.wordBorder}>
                                        <View
                                            style={[
                                                styles.wordCard,
                                                item.status === 'correct' && styles.wordCardCorrect,
                                                item.status === 'wrong' && styles.wordCardWrong,
                                            ]}>
                                            <Text
                                                style={[
                                                    styles.wordText,
                                                    item.status === 'correct' && styles.wordTextCorrect,
                                                    item.status === 'wrong' && styles.wordTextWrong,
                                                ]}>
                                                {fullWord}
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </Animated.View>
                            );
                        })}
                    </View>

                    <Text style={styles.sectionLabel}>Picture hint</Text>
                    <LinearGradient
                  colors={softBorderColors('#459fff')}
                        start={SOFT_BORDER_START}
                        end={SOFT_BORDER_END}
                  style={styles.previewBorder}>
                        <View style={styles.previewArea}>
                            {highlightedWord?.image ? (
                                <Image
                                    source={highlightedWord.image as ImageSourcePropType}
                                    style={styles.previewImage}
                                />
                            ) : (
                                <View style={styles.previewPlaceholder}>
                                    <FeatureIcon name="phraseToImage" color="#459fff" size={22} />
                                    <Text style={styles.previewPlaceholderText}>
                                        Match a word to reveal its picture
                                    </Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>

                    <Text style={styles.sectionLabel}>Alphabet tray</Text>
                    <LinearGradient
                  colors={softBorderColors('#FF8C42')}
                        start={SOFT_BORDER_START}
                        end={SOFT_BORDER_END}
                  style={styles.trayBorder}>
                        <View style={styles.trayArea}>
                            <View style={styles.trayList}>
                                {state.tray.map(item => (
                                    <DraggableLetter key={item.id} item={item} onDrop={handleDrop} />
                                ))}
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.footerArea}>
                        <TouchableOpacity
                            style={styles.controlButtonWrap}
                            onPress={() => resetLevel(levelIndex)}
                            activeOpacity={0.88}>
                            <LinearGradient
                                colors={['#90A4AE', '#607d8b']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.controlButton}>
                                <Text style={styles.controlButtonText}>Reset Level</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {allMatched && levelIndex < LEVELS.length - 1 ? (
                            <TouchableOpacity
                                style={styles.controlButtonWrap}
                                onPress={() => {
                                    void goToNextLevel();
                                }}
                                activeOpacity={0.88}>
                                <LinearGradient
                                    colors={['#43E97B', '#2e7d32']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.controlButton}>
                                    <Text style={styles.controlButtonText}>Next Level</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : null}
                    </View>
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
        bottom: 100,
        left: -70,
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    loadingWrap: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerPad: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 2,
    },
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 18,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.9)',
        shadowColor: '#459fff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        overflow: 'hidden',
    },
    headerBtnGrad: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    headerBtnText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'CarmenSans-Bold',
        lineHeight: 22,
        marginTop: -2,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    headerTitle: {
        fontSize: 15,
        color: '#1A2B4C',
        fontFamily: 'CarmenSans-ExtraBold',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    scrollContent: {
        paddingTop: 6,
        paddingBottom: 120,
    },
    levelBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.9)',
        shadowColor: '#459fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
    },
    levelIconChip: {
        width: 26,
        height: 26,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    levelIcon: {
        width: 16,
        height: 16,
    },
    levelTextBlock: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    levelKicker: {
        fontSize: 9,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: '#459fff',
        fontFamily: 'CarmenSans-Bold',
    },
    levelDot: {
        fontSize: 12,
        color: '#90A4AE',
        fontFamily: 'CarmenSans-Bold',
    },
    subtitle: {
        fontSize: 13,
        color: '#1A2B4C',
        fontFamily: 'CarmenSans-ExtraBold',
    },
    sectionLabel: {
        fontSize: 11,
        color: '#5A6D88',
        fontFamily: 'CarmenSans-SemiBold',
        marginBottom: 4,
        marginLeft: 2,
    },
    wordsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 6,
        marginBottom: 8,
    },
    wordCardShell: {
        width: '31%',
    },
    wordBorder: {
        borderRadius: 12,
        padding: 1.5,
    },
    wordCard: {
        minHeight: 56,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.96)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
        paddingVertical: 6,
    },
    wordCardCorrect: {
        backgroundColor: '#e8f5e9',
    },
    wordCardWrong: {
        backgroundColor: '#ffebee',
    },
    wordText: {
        fontSize: 16,
        color: '#1A2B4C',
        fontFamily: 'CarmenSans-Bold',
        textAlign: 'center',
    },
    wordTextCorrect: {
        color: '#2e7d32',
    },
    wordTextWrong: {
        color: '#c62828',
    },
    previewBorder: {
        borderRadius: 14,
        padding: 1.5,
        marginBottom: 8,
    },
    previewArea: {
        minHeight: 95,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.96)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    previewImage: {
        width: 90,
        height: 72,
        borderRadius: 8,
        resizeMode: 'contain',
    },
    previewPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        gap: 8,
    },
    previewPlaceholderText: {
        flexShrink: 1,
        textAlign: 'left',
        color: '#5A6D88',
        fontSize: 12,
        fontFamily: 'CarmenSans-Medium',
        lineHeight: 16,
    },
    trayBorder: {
        borderRadius: 14,
        padding: 1.5,
        marginBottom: 6,
    },
    trayArea: {
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.96)',
        padding: 8,
    },
    trayList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    letterChipWrap: {
        borderRadius: 12,
        shadowColor: '#2f80ed',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 4,
        elevation: 3,
    },
    letterChip: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    usedLetterChip: {
        opacity: 0.35,
    },
    letterText: {
        color: '#ffffff',
        fontSize: 22,
        fontFamily: 'CarmenSans-Bold',
        textTransform: 'uppercase',
    },
    footerArea: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    controlButtonWrap: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    controlButton: {
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    controlButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'CarmenSans-SemiBold',
    },
});
