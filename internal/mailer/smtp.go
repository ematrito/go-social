package mailer

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
)

type SMTPMailer struct {
	fromEmail string
	smtpAddr  string
}

func NewSMTPMailer(fromEmail, smtpAddr string) *SMTPMailer {
	if smtpAddr == "" {
		smtpAddr = "localhost:1025"
	}

	return &SMTPMailer{
		fromEmail: fromEmail,
		smtpAddr:  smtpAddr,
	}
}

func (m *SMTPMailer) Send(templateFile, username, email string, data any) (int, error) {
	tmpl, err := template.ParseFS(FS, "templates/"+templateFile)
	if err != nil {
		return -1, err
	}
	subject := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(subject, "subject", data)
	if err != nil {
		return -1, err
	}

	body := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(body, "body", data)
	if err != nil {
		return -1, err
	}

	subjectStr := subject.String()
	bodyStr := body.String()

	emailContent := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		m.fromEmail,
		email,
		subjectStr,
		bodyStr,
	)

	msgBytes := []byte(emailContent)

	err = smtp.SendMail(m.smtpAddr, nil, m.fromEmail, []string{email}, msgBytes)
	if err != nil {
		return -1, fmt.Errorf("failed to send via SMTP: %w", err)
	}

	return 201, nil
}
