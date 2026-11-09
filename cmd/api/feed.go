package main

import (
	"net/http"

	"github.com/ematrito/go-social/internal/store"
)

// GetUserFeed godoc
//
//	@Summary		Get user feed
//	@Description	Retrieves paginated feed for the authenticated user
//	@Tags			feed
//	@Accept			json
//	@Produce		json
//	@Param			limit	query		int		false	"Limit (1-20)"
//	@Param			offset	query		int		false	"Offset"
//	@Param			sort	query		string	false	"Sort order (asc/desc)"
//	@Param			tags	query		string	false	"Tags (comma-separated)"
//	@Param			search	query		string	false	"Search query"
//	@Param			since	query		string	false	"Since date"
//	@Param			until	query		string	false	"Until date"
//	@Success		200		{array}		store.PostWithMetadata
//	@Failure		400		{object}	object
//	@Failure		500		{object}	object
//	@Security		ApiKeyAuth
//	@Router			/users/feed [get]
func (app *application) getUserFeedHandler(w http.ResponseWriter, r *http.Request) {

	fq := store.PaginatedFeedQuery{
		Limit:  20,
		Offset: 0,
		Sort:   "desc",
	}

	fq, err := fq.Parse(r)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(fq); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	user := getUserFromCtx(r)
	feed, err := app.store.Posts.GetUserFeed(ctx, user.ID, fq)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if len(feed) == 0 {
		feed, err = app.store.Posts.GetRecentPosts(ctx, user.ID, fq)
		if err != nil {
			app.internalServerError(w, r, err)
			return
		}
	}

	if err := app.jsonResponse(w, http.StatusOK, feed); err != nil {
		app.internalServerError(w, r, err)
	}
}
