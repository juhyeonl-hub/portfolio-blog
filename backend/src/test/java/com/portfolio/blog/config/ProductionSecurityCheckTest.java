package com.portfolio.blog.config;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class ProductionSecurityCheckTest{
 @Test void defaultsAndInsecureCookieConfigurationCannotStartProduction(){for(String bad:java.util.List.of("","dev-api-key-change-in-production","test-"+"x".repeat(40),"short")){assertThatThrownBy(()->new ProductionSecurityCheck(bad,"j".repeat(40),"strong-secret-not-real","https://asbc.app")).isInstanceOf(IllegalStateException.class);}assertThatThrownBy(()->new ProductionSecurityCheck("k".repeat(40),"j".repeat(40),"changeme","https://asbc.app")).isInstanceOf(IllegalStateException.class);assertThatThrownBy(()->new ProductionSecurityCheck("k".repeat(40),"j".repeat(40),"strong-secret-not-real","http://asbc.app")).isInstanceOf(IllegalStateException.class);assertThatCode(()->new ProductionSecurityCheck("k".repeat(40),"j".repeat(40),"strong-secret-not-real","https://asbc.app")).doesNotThrowAnyException();}
}
