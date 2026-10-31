package com.portfolio.blog.service;

import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;

/** Process-local fixed windows. IP keys expire, remain bounded and are never logged. */
@Service
public class RequestRateLimit {
    private record Window(long until, int count) {}
    private final Map<String,Window> windows = new HashMap<>();
    public synchronized boolean allow(String key, int maximum, long duration) {
        long now=System.currentTimeMillis(); Window current=windows.get(key);
        if(current==null || current.until<=now) {
            if(windows.size()>=10000) purge();
            if(windows.size()>=10000 && current==null)return false;
            windows.put(key,new Window(now+duration,1));return true;
        }
        if(current.count>=maximum)return false;
        windows.put(key,new Window(current.until,current.count+1));return true;
    }
    @Scheduled(fixedDelay=60000)
    public synchronized void purge(){long now=System.currentTimeMillis();windows.values().removeIf(w->w.until<=now);}
}
