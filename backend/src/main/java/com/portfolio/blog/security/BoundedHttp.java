package com.portfolio.blog.security;

import java.io.*;
import java.net.http.*;
import java.nio.ByteBuffer;
import java.util.List;
import java.util.concurrent.*;

/** Limits bytes before allocation; the deadline covers headers AND the complete body. Redirects stay disabled on clients. */
public final class BoundedHttp {
    private BoundedHttp(){}
    public static HttpResponse<byte[]> send(HttpClient client,HttpRequest request,int maximum)throws IOException,InterruptedException {
        var future=client.sendAsync(request,info->new Body(maximum));
        try{return future.get(request.timeout().orElse(java.time.Duration.ofSeconds(10)).toMillis(),TimeUnit.MILLISECONDS);}
        catch(TimeoutException e){throw new HttpTimeoutException("Upstream response deadline exceeded");}
        catch(ExecutionException e){throw new IOException("Upstream response rejected",e.getCause());}
        finally{if(!future.isDone())future.cancel(true);}
    }
    public static final class Body implements HttpResponse.BodySubscriber<byte[]> {
        private final int maximum;private final CompletableFuture<byte[]> result=new CompletableFuture<>();
        private final ByteArrayOutputStream bytes=new ByteArrayOutputStream();private Flow.Subscription subscription;
        public Body(int maximum){if(maximum<1)throw new IllegalArgumentException("maximum");this.maximum=maximum;}
        public CompletionStage<byte[]> getBody(){return result;}
        public void onSubscribe(Flow.Subscription value){if(subscription!=null){value.cancel();return;}subscription=value;value.request(1);}
        public void onNext(List<ByteBuffer> buffers){
            if(result.isDone())return;
            for(var buffer:buffers){if(buffer.remaining()>maximum-bytes.size()){subscription.cancel();result.completeExceptionally(new IOException("Response too large"));return;}
                byte[] part=new byte[buffer.remaining()];buffer.get(part);bytes.writeBytes(part);}
            subscription.request(1);
        }
        public void onError(Throwable error){result.completeExceptionally(error);}
        public void onComplete(){result.complete(bytes.toByteArray());}
    }
}
