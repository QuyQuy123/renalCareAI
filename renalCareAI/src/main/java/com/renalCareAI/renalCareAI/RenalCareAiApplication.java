package com.renalCareAI.renalCareAI;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class RenalCareAiApplication {

	public static void main(String[] args) {
		SpringApplication.run(RenalCareAiApplication.class, args);
	}

}
