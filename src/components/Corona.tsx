import Svg, { Path } from 'react-native-svg';

import { PODIO } from '@/theme/podio';

/** La corona del ganador, en sol. */
export function Corona() {
  return (
    <Svg width={46} height={32} viewBox="0 0 46 32" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path
        d="M4 10 L13 18 L23 4 L33 18 L42 10 L39 29 L7 29 Z"
        fill={PODIO.corona}
        stroke={PODIO.tinta}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
