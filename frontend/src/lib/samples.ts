export interface CodeSample {
  id: string
  name: string
  language: string
  description: string
  code: string
}

export const CODE_SAMPLES: Record<string, CodeSample> = {
  python: {
    id: 'sample-python',
    name: 'Python — SQL Injection & Insecure Eval',
    language: 'python',
    description: 'Contains CWE-89 SQL Injection, CWE-95 eval RCE, and mutable default arguments.',
    code: `import os
import sqlite3

# Vulnerability 1: Hardcoded AWS cloud credential (CWE-798)
AWS_KEY = "AKIA1111222233334444"

# Vulnerability 2: Mutable default argument bug
def fetch_user_audit(user_id, audit_trail=[]):
    audit_trail.append(user_id)
    
    # Vulnerability 3: SQL Injection via f-string formatting (CWE-89)
    conn = sqlite3.connect('production.db')
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE id = '{user_id}' AND is_active = 1"
    cursor.execute(query)
    record = cursor.fetchone()
    
    # Vulnerability 4: Dangerous dynamic code execution (CWE-95)
    config_rule = os.getenv("FILTER_RULE", "True")
    is_valid = eval(config_rule)
    
    return record, audit_trail
`,
  },
  javascript: {
    id: 'sample-javascript',
    name: 'JavaScript — DOM XSS & Prototype Pollution',
    language: 'javascript',
    description: 'Contains DOM-based Cross-Site Scripting (CWE-79) and Prototype Pollution (CWE-1321).',
    code: `// Vulnerability 1: DOM-based XSS (CWE-79)
function renderUserProfile(container, userData) {
  // Directly writing unsanitized user content into innerHTML
  container.innerHTML = "<h2>Profile: " + userData.name + "</h2><p>" + userData.bio + "</p>";
}

// Vulnerability 2: Prototype Pollution (CWE-1321)
function mergeConfig(target, source) {
  for (let key in source) {
    if (key === "__proto__") {
      target[key] = source[key]; // Alters Object prototype globally
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Vulnerability 3: SQL Injection in Node.js backend
async function findAccount(db, accountId) {
  const query = \`SELECT * FROM accounts WHERE id = '\${accountId}'\`;
  return await db.query(query);
}
`,
  },
  typescript: {
    id: 'sample-typescript',
    name: 'TypeScript — XSS & Command Injection',
    language: 'typescript',
    description: 'Contains React dangerouslySetInnerHTML XSS and dangerous shell subprocess.',
    code: `import React from 'react';
import { exec } from 'child_process';

interface Props {
  content: string;
  folderName: string;
}

// Vulnerability 1: React XSS via dangerouslySetInnerHTML (CWE-79)
export const InsecureArticle: React.FC<Props> = ({ content }) => {
  return (
    <article className="prose">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
};

// Vulnerability 2: Command Injection via shell exec (CWE-78)
export function backupDirectory(folderName: string): void {
  exec(\`tar -czf backup.tar.gz /var/data/\${folderName}\`, (error, stdout) => {
    if (error) {
      console.error('Backup failed:', error);
    }
  });
}
`,
  },
  java: {
    id: 'sample-java',
    name: 'Java — JDBC SQLi & Unclosed Stream Leak',
    language: 'java',
    description: 'Contains JDBC SQL Injection (CWE-89) and unclosed FileInputStream leak (CWE-775).',
    code: `import java.sql.Connection;
import java.sql.Statement;
import java.sql.ResultSet;
import java.io.FileInputStream;
import java.io.IOException;

public class UserManager {
    // Vulnerability 1: SQL Injection via statement concatenation (CWE-89)
    public boolean verifyUser(Connection conn, String username) throws Exception {
        Statement stmt = conn.createStatement();
        String sql = "SELECT * FROM users WHERE username = '" + username + "'";
        ResultSet rs = stmt.executeQuery(sql);
        return rs.next();
    }

    // Vulnerability 2: Unclosed FileInputStream resource leak (CWE-775)
    public void readConfiguration(String path) throws IOException {
        FileInputStream fis = new FileInputStream(path);
        int data = fis.read();
        System.out.println("Config byte: " + data);
        // Missing fis.close() or try-with-resources
    }
}
`,
  },
  cpp: {
    id: 'sample-cpp',
    name: 'C++ — Buffer Overflow & Gets',
    language: 'cpp',
    description: 'Contains classic Buffer Overflow via strcpy (CWE-120) and dangerous gets (CWE-242).',
    code: `#include <iostream>
#include <cstring>
#include <cstdio>

void process_user_input() {
    char small_buffer[32];
    
    // Vulnerability 1: gets() has no boundary checks (CWE-242)
    std::cout << "Enter command: ";
    gets(small_buffer);
}

void copy_payload(const char* untrusted_input) {
    char dest_buffer[64];
    
    // Vulnerability 2: strcpy does not check destination capacity (CWE-120)
    strcpy(dest_buffer, untrusted_input);
    
    std::cout << "Copied: " << dest_buffer << std::endl;
}

int main() {
    process_user_input();
    return 0;
}
`,
  },
  go: {
    id: 'sample-go',
    name: 'Go — SQL Injection & Mutex Deadlock',
    language: 'go',
    description: 'Contains SQL Injection via fmt.Sprintf (CWE-89) and Mutex lock without defer unlock.',
    code: `package main

import (
\t"database/sql"
\t"fmt"
\t"sync"
)

type Cache struct {
\tmu   sync.Mutex
\tdata map[string]string
}

// Vulnerability 1: Mutex Lock without defer Unlock causes permanent deadlock on early return
func (c *Cache) Get(key string) (string, error) {
\tc.mu.Lock()
\tif key == "" {
\t\treturn "", fmt.Errorf("empty key") // Missing c.mu.Unlock()!
\t}
\tval := c.data[key]
\tc.mu.Unlock()
\treturn val, nil
}

// Vulnerability 2: SQL Injection via fmt.Sprintf (CWE-89)
func FindUser(db *sql.DB, username string) (*sql.Rows, error) {
\tquery := fmt.Sprintf("SELECT id, email FROM users WHERE name = '%s'", username)
\treturn db.Query(query)
}
`,
  },
  reactjs: {
    id: 'sample-reactjs',
    name: 'React JS — XSS & State Management Bugs',
    language: 'reactjs',
    description: 'Contains React-specific XSS via dangerouslySetInnerHTML, unsafe fetch, and missing useEffect cleanup.',
    code: `import React, { useState, useEffect } from 'react';

// Vulnerability 1: XSS via dangerouslySetInnerHTML (CWE-79)
function UserComment({ comment }) {
  return (
    <div
      className="comment-box"
      dangerouslySetInnerHTML={{ __html: comment.content }}
    />
  );
}

// Vulnerability 2: Missing useEffect cleanup — memory leak
function LiveFeed({ userId }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(\`/api/posts/\${userId}\`);
      const data = await res.json();
      setPosts(data);
    }, 2000);
    // Missing: return () => clearInterval(interval);
  }, [userId]);

  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}

// Vulnerability 3: Storing sensitive token in localStorage (CWE-922)
function LoginForm() {
  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user: e.target.user.value, pass: e.target.pass.value }),
    });
    const { token } = await res.json();
    localStorage.setItem('auth_token', token); // Exposed to XSS attacks
  };

  return (
    <form onSubmit={handleLogin}>
      <input name="user" placeholder="Username" />
      <input name="pass" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
}
`,
  },
  c: {
    id: 'sample-c',
    name: 'C — Buffer Overflow & Dangerous Input',
    language: 'c',
    description: 'Contains dangerous gets() (CWE-242) and buffer overflow via strcpy (CWE-120).',
    code: `#include <stdio.h>
#include <string.h>

void read_input() {
    char buffer[64];
    // Vulnerability 1: gets does not perform bounds checking (CWE-242)
    printf("Enter username: ");
    gets(buffer);
}

void process_data(char *input) {
    char target[32];
    // Vulnerability 2: strcpy can overflow target buffer (CWE-120)
    strcpy(target, input);
}

int main() {
    read_input();
    return 0;
}
`,
  },
  csharp: {
    id: 'sample-csharp',
    name: 'C# — SQL Injection & Insecure Deserialization',
    language: 'csharp',
    description: 'Contains SqlCommand SQL Injection (CWE-89) and hardcoded credentials (CWE-798).',
    code: `using System;
using System.Data.SqlClient;

namespace SecurityDemo
{
    public class AccountService
    {
        // Vulnerability 1: Hardcoded credentials (CWE-798)
        private const string ConnectionString = "Server=db.internal;User Id=sa;Password=SuperSecret123!;";

        // Vulnerability 2: SQL Injection via query string concatenation (CWE-89)
        public void AuthenticateUser(string username, string password)
        {
            using (var conn = new SqlConnection(ConnectionString))
            {
                conn.Open();
                string query = "SELECT * FROM Users WHERE Username = '" + username + "' AND Password = '" + password + "'";
                using (var cmd = new SqlCommand(query, conn))
                {
                    var reader = cmd.ExecuteReader();
                    Console.WriteLine(reader.HasRows ? "Authorized" : "Denied");
                }
            }
        }
    }
}
`,
  },
  php: {
    id: 'sample-php',
    name: 'PHP — SQL Injection & Insecure Eval',
    language: 'php',
    description: 'Contains classic mysqli SQL Injection (CWE-89) and arbitrary eval RCE (CWE-95).',
    code: `<?php
// Vulnerability 1: SQL Injection via unsanitized $_GET parameter (CWE-89)
$userId = $_GET['user_id'];
$conn = new mysqli("localhost", "root", "secret", "app_db");
$query = "SELECT * FROM users WHERE id = " . $userId;
$result = $conn->query($query);

// Vulnerability 2: Dangerous dynamic code execution (CWE-95)
$customFilter = $_POST['filter_expression'];
eval('$isValid = ' . $customFilter . ';');

// Vulnerability 3: Reflected Cross-Site Scripting (CWE-79)
echo "<h1>Welcome, " . $_GET['username'] . "</h1>";
?>
`,
  },
  rust: {
    id: 'sample-rust',
    name: 'Rust — Unsafe Memory Access & Panic Risk',
    language: 'rust',
    description: 'Demonstrates unsafe block pointer dereferencing and unhandled Result unwrap panic.',
    code: `use std::fs::File;
use std::io::Read;

pub fn read_config(path: &str) -> String {
    // Code smell / Panic risk: unwrap() on untrusted file I/O
    let mut file = File::open(path).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    contents
}

pub fn read_raw_memory(ptr: *const i32) -> i32 {
    // Unsafe block: raw pointer dereference without validation
    unsafe {
        *ptr
    }
}

fn main() {
    let dummy = 42;
    println!("Value: {}", read_raw_memory(&dummy));
}
`,
  },
  kotlin: {
    id: 'sample-kotlin',
    name: 'Kotlin — SQL Injection & Insecure WebSettings',
    language: 'kotlin',
    description: 'Contains Android WebView vulnerabilities and raw database query injection.',
    code: `package com.example.security

import java.sql.DriverManager
import android.webkit.WebView

class UserRepository {
    // Vulnerability 1: SQL Injection in raw JDBC statement (CWE-89)
    fun findUser(username: String): Boolean {
        val conn = DriverManager.getConnection("jdbc:postgresql://localhost/app", "user", "pass")
        val statement = conn.createStatement()
        val sql = "SELECT * FROM accounts WHERE name = '$username'"
        val resultSet = statement.executeQuery(sql)
        return resultSet.next()
    }

    // Vulnerability 2: Insecure WebView settings allowing JavaScript interface reflection
    fun configureWebView(webView: WebView) {
        webView.settings.javaScriptEnabled = true
        webView.settings.allowFileAccessFromFileURLs = true
        webView.settings.allowUniversalAccessFromFileURLs = true
    }
}
`,
  },
  swift: {
    id: 'sample-swift',
    name: 'Swift — Insecure TLS & CoreData Injection',
    language: 'swift',
    description: 'Contains disabled SSL evaluation and NSPredicate injection in iOS/macOS.',
    code: `import Foundation

class NetworkManager {
    // Vulnerability 1: Disabled SSL certificate validation (CWE-295)
    func allowInsecureConnection() -> URLSessionConfiguration {
        let config = URLSessionConfiguration.default
        // Disabling App Transport Security / trusting all certs
        return config
    }

    // Vulnerability 2: NSPredicate Injection (CWE-89 analog)
    func searchAccounts(nameQuery: String) -> String {
        let predicateFormat = "username == '" + nameQuery + "'"
        let predicate = NSPredicate(format: predicateFormat)
        return predicate.predicateFormat
    }
}
`,
  },
  ruby: {
    id: 'sample-ruby',
    name: 'Ruby — Command Injection & Code Smell',
    language: 'ruby',
    description: 'Contains system command injection via backticks (CWE-78) and SQL concatenation.',
    code: `require 'sqlite3'

class AdminService
  # Vulnerability 1: Command Injection via shell backticks (CWE-78)
  def run_backup(backup_target)
    result = \`tar -czf backup.tar.gz #{backup_target}\`
    puts "Result: #{result}"
  end

  # Vulnerability 2: SQL Injection in ActiveRecord-style raw query (CWE-89)
  def find_user(db, email)
    db.execute("SELECT * FROM users WHERE email = '#{email}'")
  end

  # Code Smell: Bare rescue masking critical exceptions
  def unsafe_operation
    do_something_risky
  rescue
    nil
  end
end
`,
  },
  html: {
    id: 'sample-html',
    name: 'HTML — Insecure Form, Mixed Content & XSS',
    language: 'html',
    description: 'Contains insecure HTTP form submission, mixed content script loading, and inline event XSS.',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login Portal</title>
  <!-- Vulnerability 1: Insecure mixed content script over plaintext HTTP (CWE-311) -->
  <script src="http://cdn.insecure-cdn.com/analytics.js"></script>
</head>
<body>
  <!-- Vulnerability 2: Form transmitting credentials over unencrypted HTTP (CWE-319) -->
  <form action="http://api.example.com/v1/auth" method="POST">
    <h2>Secure User Login</h2>
    <label for="username">Username:</label>
    <input type="text" id="username" name="username" required>
    
    <label for="password">Password:</label>
    <input type="password" id="password" name="password" autocomplete="on">
    
    <!-- Vulnerability 3: Inline javascript execution vector (CWE-79) -->
    <button type="submit" onclick="document.write('Submitting for: ' + location.search)">Login</button>
  </form>
</body>
</html>
`,
  },
  css: {
    id: 'sample-css',
    name: 'CSS — Modern Dashboard Styling',
    language: 'css',
    description: 'Clean modern CSS stylesheet for syntax highlighting demo and styling testing.',
    code: `/* CodeGuardian AI Dashboard Theme */
:root {
  --primary-accent: #3b82f6;
  --bg-dark: #0f172a;
  --text-main: #f8fafc;
  --border-subtle: #334155;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--bg-dark);
  color: var(--text-main);
  line-height: 1.6;
}

.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(8px);
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}
`,
  },
  sql: {
    id: 'sample-sql',
    name: 'SQL — Insecure Dynamic Query & Grant',
    language: 'sql',
    description: 'Demonstrates SQL injection patterns, dangerous wildcard grants, and plaintext password storage.',
    code: `-- Vulnerability 1: Plaintext password storage column without hashing
CREATE TABLE user_credentials (
    user_id INT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password_plaintext VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user'
);

-- Vulnerability 2: Dynamic SQL construction susceptible to SQL Injection (CWE-89)
-- Simulating query built in stored procedure or application script
SELECT * FROM user_credentials 
WHERE username = 'admin' OR '1'='1' -- Malicious injection payload
  AND password_plaintext = 'secret';

-- Vulnerability 3: Excessive wildcard privileges granted to public/app user (CWE-272)
GRANT ALL PRIVILEGES ON DATABASE production_db TO 'guest_user'@'%';
`,
  },
  mysql: {
    id: 'sample-mysql',
    name: 'MySQL — Unsafe Procedure & SQL Injection',
    language: 'mysql',
    description: 'MySQL stored procedure with dynamic SQL statement concatenation and privilege escalation risks.',
    code: `DELIMITER //

CREATE PROCEDURE GetUserAccount(IN userInput VARCHAR(255))
BEGIN
    -- Vulnerability 1: Dynamic SQL statement concatenation allows SQL Injection
    SET @sql = CONCAT('SELECT id, username, balance FROM accounts WHERE account_id = ', userInput);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //

DELIMITER ;

-- Vulnerability 2: Weak authentication config and open root host access
CREATE USER 'app_admin'@'%' IDENTIFIED BY 'admin123';
GRANT ALL ON *.* TO 'app_admin'@'%' WITH GRANT OPTION;
`,
  },
  postgresql: {
    id: 'sample-postgresql',
    name: 'PostgreSQL — Dynamic EXECUTE Injection',
    language: 'postgresql',
    description: 'PL/pgSQL function with unsanitized EXECUTE query injection and insecure superuser grant.',
    code: `CREATE OR REPLACE FUNCTION search_customer_orders(user_input TEXT)
RETURNS SETOF orders AS $$
BEGIN
    -- Vulnerability 1: Format string SQL Injection in dynamic EXECUTE (CWE-89)
    RETURN QUERY EXECUTE
        'SELECT * FROM orders WHERE customer_name = ''' || user_input || ''' ORDER BY created_at DESC';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vulnerability 2: Dangerous superuser privilege assignment
ALTER USER reporting_service WITH SUPERUSER;
`,
  },
  plsql: {
    id: 'sample-plsql',
    name: 'PL/SQL — Dynamic SQL Injection (EXECUTE IMMEDIATE)',
    language: 'plsql',
    description: 'Oracle PL/SQL procedure using unescaped string concatenation inside EXECUTE IMMEDIATE.',
    code: `CREATE OR REPLACE PROCEDURE find_employee(
    p_dept_id IN VARCHAR2,
    p_cursor OUT SYS_REFCURSOR
)
AS
    v_sql VARCHAR2(1000);
BEGIN
    -- Vulnerability: Dynamic SQL Injection via unvalidated concatenation (CWE-89)
    v_sql := 'SELECT emp_id, salary FROM employees WHERE department_id = ' || p_dept_id;
    
    OPEN p_cursor FOR v_sql;
END find_employee;
/
`,
  },
  bash: {
    id: 'sample-bash',
    name: 'Bash — Command Injection & Unquoted Variables',
    language: 'bash',
    description: 'Contains command injection via eval/backticks and unquoted variable expansion bugs.',
    code: `#!/usr/bin/env bash

TARGET_DIR="$1"
USER_INPUT="$2"

# Vulnerability 1: Command injection via unvalidated eval execution (CWE-78)
echo "Processing command..."
eval "echo Performing query for: $USER_INPUT"

# Vulnerability 2: Unquoted variable expansion subject to word splitting and globbing
tar -czf archive.tar.gz $TARGET_DIR

# Vulnerability 3: Insecure temporary file creation prone to symlink attacks (CWE-377)
TEMP_FILE="/tmp/debug_log.txt"
echo "Log: $(date)" >> $TEMP_FILE
chmod 777 $TEMP_FILE
`,
  },
  nodejs: {
    id: 'sample-nodejs',
    name: 'Node.js — Express SSRF & Path Traversal',
    language: 'nodejs',
    description: 'Node.js Express backend with path traversal and arbitrary child process execution.',
    code: `const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();

// Vulnerability 1: Path Traversal (CWE-22)
app.get('/download', (req, res) => {
  const filename = req.query.file;
  const filePath = '/var/www/uploads/' + filename;
  const data = fs.readFileSync(filePath); // Unrestricted ../ access
  res.send(data);
});

// Vulnerability 2: Command Injection (CWE-78)
app.get('/ping', (req, res) => {
  const host = req.query.host;
  exec('ping -c 1 ' + host, (err, stdout) => {
    res.send(stdout);
  });
});

app.listen(3000);
`,
  },
  reactts: {
    id: 'sample-reactts',
    name: 'React TS — XSS & Type Safety Pitfalls',
    language: 'reactts',
    description: 'TypeScript React component with dangerouslySetInnerHTML XSS and unsafe type assertions.',
    code: `import React, { FC, useState } from 'react';

interface CommentProps {
  rawHtml: string;
  metadata: any; // Type-safety smell: use of 'any'
}

export const RichComment: FC<CommentProps> = ({ rawHtml, metadata }) => {
  const [likes, setLikes] = useState<number>(0);

  // Vulnerability 1: Cross-Site Scripting via dangerouslySetInnerHTML (CWE-79)
  return (
    <div className="comment-card">
      <div 
        className="rendered-content" 
        dangerouslySetInnerHTML={{ __html: rawHtml }} 
      />
      <button onClick={() => setLikes(likes + 1)}>
        Likes: {likes} (Author: {metadata.author})
      </button>
    </div>
  );
};
`,
  },
  json: {
    id: 'sample-json',
    name: 'JSON — Insecure Application Configuration',
    language: 'json',
    description: 'Configuration file exhibiting insecure defaults, exposed API keys, and debug mode enabled.',
    code: `{
  "application": {
    "name": "CodeGuardian-Demo",
    "version": "1.0.0",
    "environment": "production",
    "debug": true
  },
  "security": {
    "enableCors": true,
    "allowedOrigins": ["*"],
    "apiKey": "sk-live-99a8b7c6d5e4f3a2b1c0d9e8",
    "jwtSecret": "insecure_default_secret_key_123"
  },
  "database": {
    "host": "0.0.0.0",
    "port": 5432,
    "ssl": false
  }
}
`,
  },
  yaml: {
    id: 'sample-yaml',
    name: 'YAML — Insecure CI/CD & Kubernetes Spec',
    language: 'yaml',
    description: 'Configuration demonstrating privileged container execution and cleartext secret injection.',
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: insecure-worker
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: app
          image: app:latest
          # Vulnerability 1: Running container in privileged mode (CWE-250)
          securityContext:
            privileged: true
            runAsUser: 0
          # Vulnerability 2: Plaintext secrets embedded directly in environment
          env:
            - name: DATABASE_PASSWORD
              value: "SuperSecretProductionPassword2026"
            - name: AWS_ACCESS_KEY_ID
              value: "AKIAIOSFODNN7EXAMPLE"
`,
  },
  xml: {
    id: 'sample-xml',
    name: 'XML — XXE (XML External Entity) Vulnerability',
    language: 'xml',
    description: 'Demonstrates an XML document defining an external entity payload for system file retrieval.',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<!-- Vulnerability 1: XML External Entity (XXE) Injection (CWE-611) -->
<!DOCTYPE root [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<userAccount>
  <username>john_doe</username>
  <email>john@example.com</email>
  <description>&xxe;</description>
</userAccount>
`,
  },
  markdown: {
    id: 'sample-markdown',
    name: 'Markdown — Security Documentation README',
    language: 'markdown',
    description: 'Markdown documentation sample with formatting, code snippets, and security advisories.',
    code: `# CodeGuardian AI — Security Audit Guide

## Overview
CodeGuardian AI performs real-time static analysis and automated vulnerability detection.

### Supported Language Engines
- **Core**: Python, Java, C#, PHP, Go, Rust, Kotlin, Swift, Ruby, C, C++
- **Web**: HTML, CSS, JavaScript, TypeScript, React
- **Databases**: SQL, MySQL, PostgreSQL, PL/SQL

### Vulnerability Severity Matrix
| Severity | Action Required | Response SLA |
| :--- | :--- | :--- |
| **Critical** | Immediate Hotfix | < 4 hours |
| **High** | Patch in Current Sprint | < 24 hours |
| **Medium** | Backlog Prioritization | < 7 days |
| **Low** | Code Review Feedback | Routine |

> **Warning**: Never run untrusted code snippets without isolated sandbox execution!
`,
  },
}
