package dev.hrichi.orbit.config;

import dev.hrichi.orbit.night.MeteorShowers;
import org.hipparchus.analysis.differentiation.DerivativeStructure;
import org.hipparchus.analysis.differentiation.Gradient;
import org.hipparchus.analysis.differentiation.UnivariateDerivative1;
import org.hipparchus.analysis.differentiation.UnivariateDerivative2;
import org.hipparchus.util.Binary64;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.aot.hint.annotation.RegisterReflectionForBinding;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ImportRuntimeHints;

/**
 * What a GraalVM native image can't discover on its own (ADR-0013): files
 * read from the classpath, records that Jackson builds outside a controller
 * signature, and the arrays Hipparchus creates reflectively for Orekit's
 * frame transforms. Ignored on the JVM.
 */
@Configuration(proxyBeanMethods = false)
@ImportRuntimeHints(NativeHints.Resources.class)
@RegisterReflectionForBinding(MeteorShowers.Shower.class)
public class NativeHints {

    static class Resources implements RuntimeHintsRegistrar {
        @Override
        public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
            hints.resources().registerPattern("meteor-showers.json");
            // Orekit reads its nutation and precession tables, and its messages, from the jar.
            hints.resources().registerPattern("assets/org/orekit/IERS-conventions/*/*");
            hints.resources().registerPattern("assets/org/orekit/localization/*");
            // MathArrays.buildArray uses Array.newInstance on the field's element class.
            for (Class<?> element : new Class<?>[] {
                UnivariateDerivative1.class,
                UnivariateDerivative2.class,
                Gradient.class,
                DerivativeStructure.class,
                Binary64.class
            }) {
                hints.reflection().registerType(element.arrayType());
                hints.reflection().registerType(element.arrayType().arrayType());
            }
        }
    }
}
