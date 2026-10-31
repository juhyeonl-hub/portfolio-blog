package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.time.Instant;
import java.util.function.LongSupplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SteamActivityService {
    public static final String SOURCE = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=3393110";
    public record Activity(String source, String appId, String scope, long players, String checkedAt, boolean stale) {}
    private final ObjectMapper mapper;
    private final HttpClient client;
    private final LongSupplier clock;
    private Activity last;
    private long nextAttempt;
    private boolean failed;

    @Autowired
    public SteamActivityService(ObjectMapper mapper) {
        this(mapper,HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build(),System::currentTimeMillis);
    }
    SteamActivityService(ObjectMapper mapper,HttpClient client,LongSupplier clock) {
        this.mapper=mapper;this.client=client;this.clock=clock;
    }
    public synchronized Activity current() {
        long now=clock.getAsLong();
        if(now>=nextAttempt) {
            nextAttempt=now+60_000;
            try {
                var request=HttpRequest.newBuilder(URI.create(SOURCE)).timeout(Duration.ofSeconds(5)).header("Accept","application/json").GET().build();
                var response=com.portfolio.blog.security.BoundedHttp.send(client,request,65_536);
                {
                    if(response.statusCode()!=200)throw new IllegalStateException("Steam unavailable");
                    byte[] bytes=response.body();
                    if(bytes.length>65_536)throw new IllegalStateException("Response too large");
                    var data=mapper.readTree(bytes);
                    if(data==null)throw new IllegalStateException("Empty response");
                    var result=data.path("response");var count=result.path("player_count");
                    if(!result.path("result").isIntegralNumber()||!result.path("result").canConvertToInt()||result.path("result").asInt()!=1||!count.isIntegralNumber()||!count.canConvertToLong()||count.asLong()<0||count.asLong()>1_000_000_000L)throw new IllegalStateException("Invalid Steam count");
                    last=new Activity(SOURCE,"3393110","steam-global-total",count.asLong(),Instant.ofEpochMilli(clock.getAsLong()).toString(),false);
                    failed=false;
                }
            } catch(Exception e) {
                failed=true;
                if(e instanceof InterruptedException)Thread.currentThread().interrupt();
            }
        }
        if(last==null)throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Steam 접속자 수를 확인하지 못했습니다.");
        return new Activity(last.source(),last.appId(),last.scope(),last.players(),last.checkedAt(),failed);
    }
}
