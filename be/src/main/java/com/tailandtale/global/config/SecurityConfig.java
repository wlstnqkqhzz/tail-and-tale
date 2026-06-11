package com.tailandtale.global.config;

import com.tailandtale.global.jwt.JwtFilter;
import com.tailandtale.global.oauth.CookieOAuth2AuthorizationRequestRepository;
import com.tailandtale.global.oauth.OAuth2SuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

import java.nio.charset.StandardCharsets;

// Spring Security 설정 클래스

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            OAuth2SuccessHandler oAuth2SuccessHandler,
            CookieOAuth2AuthorizationRequestRepository cookieOAuth2AuthorizationRequestRepository
    ) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .requestCache(cache -> cache.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exception -> exception
                        .defaultAuthenticationEntryPointFor(
                                apiAuthenticationEntryPoint(),
                                PathPatternRequestMatcher.pathPattern("/api/**")
                        )
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(SecurityPath.PUBLIC_API).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authorization -> authorization
                                .authorizationRequestRepository(cookieOAuth2AuthorizationRequestRepository)
                        )
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    private AuthenticationEntryPoint apiAuthenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("""
                    {"status":401,"error":"UNAUTHORIZED","message":"인증이 필요합니다."}
                    """);
        };
    }
}
