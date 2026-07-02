package mailer

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net/smtp"
	"os"
	"time"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

type SendGridMailer struct {
	fromEmail string
	apiKey    string
	client    *sendgrid.Client
}

func NewSendGrid(apiKey, fromEmail string) *SendGridMailer {
	client := sendgrid.NewSendClient(apiKey)

	return &SendGridMailer{
		fromEmail: fromEmail,
		apiKey:    apiKey,
		client:    client,
	}
}

func (m *SendGridMailer) Send(templateFile, username, email string, data any, isSandbox bool) error {

	from := mail.NewEmail(FromName, m.fromEmail)

	to := mail.NewEmail(username, email)

	tmpl, err := template.ParseFS(FS, "templates/"+templateFile)
	if err != nil {
		return err
	}
	subject := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(subject, "subject", data)
	if err != nil {
		return err
	}

	body := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(body, "body", data)
	if err != nil {
		return err
	}

	subjectStr := subject.String()
	bodyStr := body.String()

	if isSandbox {
		log.Printf("Routing email to Mailpit (development mode)")
		return m.sendViaSMTP(m.fromEmail, email, subjectStr, bodyStr)
	}

	message := mail.NewSingleEmail(from, subjectStr, to, "", bodyStr)

	message.SetMailSettings(&mail.MailSettings{
		SandboxMode: &mail.Setting{
			Enable: &isSandbox,
		},
	})

	for i := 0; i < maxRetries; i++ {
		response, err := m.client.Send(message)
		if err != nil {
			log.Printf("Failed to send email to %v, attempt %d of %d", email, i+1, maxRetries)
			log.Printf("Error: %v", err.Error())

			//exponential backoff
			time.Sleep(time.Second * time.Duration(i+1))
			continue
		}
		log.Printf("Email sent with status code %v", response.StatusCode)
		return nil
	}

	return fmt.Errorf("failed to send email after %d attempts", maxRetries)
}

func (m *SendGridMailer) sendViaSMTP(from, to, subject, body string) error {
	smtpAddr := os.Getenv("MAILPIT_SMTP_ADDR")
	if smtpAddr == "" {
		smtpAddr = "localhost:1025" // Fallback
	}

	emailContent := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s", from, to, subject, body)

	msgBytes := []byte(emailContent)

	err := smtp.SendMail(smtpAddr, nil, from, []string{to}, msgBytes)
	if err != nil {
		return fmt.Errorf("failed to send via Mailpit: %w", err)
	}

	log.Printf("Email successfully caught by Mailpit")
	return nil
}
