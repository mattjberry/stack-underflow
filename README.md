# Stack Underflow

Stack Underflow is a fully functional forum site allowing users to create accounts, channels, posts and replies, including upvotes, downvotes and image uploads. Functionally a clone of Stack Overflow created as project for CMPT353 Full Stack Development using Docker, Next.js, NextAuth.js and PostgreSQL.

A small portion of the project was written with the assistance of Claude Code, to gain experience with modern AI assisted development tools. Affected code includes the voting buttons and their behaviours, limiting users to one vote per posts and toggling between upvotes and downvotes.


## Start-up Instructions

Clone the repository and navigate to the project/ directory.\
With the Docker deamon running, run docker compose up.\
Once all containers have started (may take about 30 seconds)\
open a browser of your choice and visit https://localhost:3000

## Exposed Ports

The Next.js app is accessible through port 3000.\
The Postgres database runs on port 5432 and is accessible for direct database access.

## Admin Access

The seeded admin account is accessible using the following credentials:\
**username:** admin\
**password:** yourpassword

With admin access, you know have permissions to delete channels, posts and replies. Deleting a channel will also all posts within it, and deleting a post/reply will delete all of the replies. delete Using the admin panel, you can also delete specific users. Content created by a user that is deleted will remain in the database and be displayed with the name omitted.

## Seed Data

Seed data including three sample users, one admin account, three channels and several posts and replies is loaded by default when the program starts. This can be disabled by removing 02_seed.sql from the list of volumes in the Docker compose file. Note that doing so will change the behaviour of deleted users: on posts that they have created, the name associated with the post will be blank instead of defaulting to a 'deleted user'.

## Demo Video