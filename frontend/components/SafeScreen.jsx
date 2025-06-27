import React from 'react';
import { View } from 'react-native';
import { COLORS } from '@/constants/color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeScreen = ({ children }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, flex: 1, backgroundColor: COLORS.Background }}>
      {children}
    </View>
  );
};

export default SafeScreen;