package com.portfolio.blog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Sign-in attempt addresses are dropped after the 10-minute window even when no further attempt arrives. */
class CommunityThrottleRetentionTest {
    @Test
    void expiredAddressesArePurgedWithoutANewAttempt() throws Exception {
        var service = new CommunityService(null, new BCryptPasswordEncoder(4), null, null);
        service.throttle("198.51.100.7|steam");
        service.throttle("198.51.100.8|someone");
        assertEquals(2, service.trackedAttemptKeys());
        long now = System.currentTimeMillis();
        service.purgeAttempts(now);
        assertEquals(2, service.trackedAttemptKeys());
        service.purgeAttempts(now + 600_001);
        assertEquals(0, service.trackedAttemptKeys());
        Method scheduled = CommunityService.class.getMethod("purgeExpiredAttempts");
        assertEquals(60_000, scheduled.getAnnotation(Scheduled.class).fixedDelay());
    }
}
