package mailer

import "errors"

type MockMailer struct {
	shouldFail bool
}

func (mm *MockMailer) Send(templateFile, username, email string, data any) (int, error) {
	if mm.shouldFail {
		return 0, errors.New("send failed")
	}
	return 200, nil
}
