package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
)

type UpdatePostPayload struct {
	Title   *string `json:"title"`
	Content *string `json:"content"`
	// Version int     `json:"version" validate:"required"`
}

func updatePost(postID int, payload UpdatePostPayload, wg *sync.WaitGroup) {
	defer wg.Done()

	// construct URL for update endpoint
	url := fmt.Sprintf("http://localhost:3001/v1/posts/%d", postID)

	// creates JSON payload
	b, _ := json.Marshal(payload)

	req, err := http.NewRequest("PATCH", url, bytes.NewBuffer(b))
	if err != nil {
		fmt.Println("Error during request creation:", err)
		return
	}

	// set headers
	req.Header.Set("Content-Type", "application/json")

	// send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return
	}

	defer resp.Body.Close()

	fmt.Println("Update response status:", resp.Status)
}

func main() {
	var wg sync.WaitGroup

	// assuming one post to update
	postID := 6

	// simulating 2 users are updating same post simultaneously
	wg.Add(2)
	content := "UPDATE CONTENT FROM USER B"
	title := "UPDATE TITLE FROM USER A"

	go updatePost(postID, UpdatePostPayload{Title: &title}, &wg)
	go updatePost(postID, UpdatePostPayload{Content: &content}, &wg)
	wg.Wait()
}
