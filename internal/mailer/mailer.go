package mailer

const (
	FromName   = "GopherSocial"
	maxRetries = 3
)

type Client interface {
	Send(templateFile, username, email string, data any, isSandbox bool) error
}
