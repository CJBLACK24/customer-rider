// client/components/LayoutSafe.tsx
import React, { forwardRef } from "react";
import { StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated from "react-native-reanimated";

/**
 * LayoutSafe
 * Puts layout animations on the OUTER Animated.View, and moves any `transform`
 * from the incoming `style` to an INNER Animated.View. This avoids:
 *   [Reanimated] "transform ... may be overwritten by a layout animation"
 *
 * Usage:
 *   <LayoutSafe layout={LinearTransition.springify()} style={{ transform:[{translateY:-6}], padding:12 }}>
 *     ...content...
 *   </LayoutSafe>
 */
type AnimatedViewProps = React.ComponentProps<typeof Animated.View>;

function splitTransform(style?: StyleProp<ViewStyle>) {
  const flat = StyleSheet.flatten(style) || {};
  const { transform, ...rest } = flat as ViewStyle;
  return {
    hasTransform: !!transform,
    transformStyle: transform ? ({ transform } as ViewStyle) : undefined,
    outerStyle: rest as ViewStyle,
  };
}

const LayoutSafe = forwardRef<any, AnimatedViewProps>(function LayoutSafe(
  { style, children, ...rest },
  ref
) {
  const { hasTransform, transformStyle, outerStyle } = splitTransform(style as StyleProp<ViewStyle>);

  return (
    // OUTER: receives layout animations (no transform)
    <Animated.View ref={ref} {...rest} style={outerStyle}>
      {hasTransform ? (
        // INNER: receives transform; must be Animated.View to accept SharedValue<ReactNode>
        <Animated.View style={transformStyle}>{children}</Animated.View>
      ) : (
        children
      )}
    </Animated.View>
  );
});

export default LayoutSafe;
