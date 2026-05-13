package db

import (
	"context"
	"fmt"
	"github/ematrito/go-social/internal/store"
	"log"
	"math/rand"
)

func Seed(store store.Storage) {
	ctx := context.Background()

	users := generateUsers(100)
	for _, user := range users {
		if err := store.Users.Create(ctx, user); err != nil {
			log.Println("error during users creation:", err)
			return
		}
	}

	posts := generatePosts(200, users)
	for _, post := range posts {
		if err := store.Posts.Create(ctx, post); err != nil {
			log.Println("error during posts creation:", err)
			return
		}
	}

	comments := generateComments(500, users, posts)
	for _, comment := range comments {
		if err := store.Comments.Create(ctx, comment); err != nil {
			log.Println("error during posts creation:", err)
			return
		}
	}

	log.Println("Seeding complete.")
}
func generateUsers(num int) []*store.User {
	users := make([]*store.User, num)

	for i := range num {
		username := fmt.Sprintf("user_%d", i)
		email := fmt.Sprintf("%s@example.com", username)

		users[i] = &store.User{
			Username: username,
			Email:    email,
			Password: "asdasdasd",
		}
	}
	return users
}

func generatePosts(num int, users []*store.User) []*store.Post {
	posts := make([]*store.Post, num)

	for i := range num {
		user := users[rand.Intn(len(users))]
		title := fmt.Sprintf("title_%d", i)
		content := fmt.Sprintf("%s post", title)
		tags := []string{"tag1", "tag2", "tag3"}
		posts[i] = &store.Post{
			Title:   title,
			Content: content,
			UserID:  user.ID,
			Tags:    tags,
		}
	}
	return posts
}
func generateComments(num int, users []*store.User, posts []*store.Post) []*store.Comment {
	comments := make([]*store.Comment, num)

	contents := []string{
		"Great point!", "I disagree with this.", "Interesting perspective.",
		"Could you clarify?", "Exactly what I thought.", "Thanks for sharing!",
		"Nice work.", "I love this!", "Wait, really?", "Very helpful.",
		"Not sure about this.", "Keep it up!", "This is a masterpiece.",
		"Following for updates.", "Simple and clean.", "Check your sources.",
	}

	for i := range num {
		user := users[rand.Intn(len(users))]
		post := posts[rand.Intn(len(posts))]
		content := contents[i%len(contents)]

		comments[i] = &store.Comment{
			PostID:  post.ID,
			UserID:  user.ID,
			Content: content,
		}
	}
	return comments
}
