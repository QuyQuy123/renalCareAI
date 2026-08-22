package com.renalCareAI.renalCareAI.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Mã xác nhận đăng ký tài khoản RenalCareAI");
            message.setText("Chào bạn,\n\n"
                    + "Mã xác nhận (OTP) của bạn là: " + otp + "\n"
                    + "Mã này có hiệu lực trong vòng 5 phút.\n\n"
                    + "Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\n"
                    + "Trân trọng,\nĐội ngũ RenalCareAI");
            
            mailSender.send(message);
            logger.info("OTP email sent successfully to {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send OTP email to {}", toEmail, e);
            throw new RuntimeException("Không thể gửi email xác nhận. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau.");
        }
    }
}
