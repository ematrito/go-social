package main

import (
	"github/ematrito/go-social/internal/store"
	"net/http"
)

type CreateCommentPayload struct {
	Content string `json:"content" validate:"required,max=1000"`
}

// CreateComment godoc
//
//	@Summary		Add a comment
//	@Description	Adds a comment to a post
//	@Tags			comments
//	@Accept			json
//	@Produce		json
//	@Param			postID	path		int						true	"Post ID"
//	@Param			payload	body		CreateCommentPayload	true	"Comment payload"
//	@Success		201		{object}	store.Comment
//	@Failure		400		{object}	object
//	@Failure		404		{object}	object
//	@Failure		500		{object}	object
//	@Router			/v1/posts/{postID}/comments [post]
func (app *application) createCommentHandler(w http.ResponseWriter, r *http.Request) {
	post := getPostFromCtx(r)

	var payload CreateCommentPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	comment := &store.Comment{
		Content: payload.Content,
		UserID:  1,
		PostID:  post.ID,
	}

	ctx := r.Context()

	if err := app.store.Comments.Create(ctx, comment); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, comment); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}
