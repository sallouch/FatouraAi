# FatouraAI — Backend

API REST développée avec **NestJS** + **TypeORM** + **Supabase (PostgreSQL)** dans le cadre du projet de fin d'année (PFA) à l'ISIMM.

## Présentation

FatouraAI est une plateforme de facturation intelligente destinée aux entreprises tunisiennes. Le backend expose les endpoints nécessaires à la gestion des factures, des clients, des produits, du stock, des notifications et de l'authentification. Il intègre également un chatbot basé sur **Google Gemini** permettant de créer des factures en langage naturel.

## Stack technique

| Technologie | Rôle |
|---|---|
| NestJS v11 | Framework backend |
| TypeORM | ORM PostgreSQL |
| Supabase | Base de données cloud (PostgreSQL) |
| JWT | Authentification |
| Google Gemini (`@google/genai`) | Chatbot IA |
| class-validator | Validation des DTOs |

## Modules

| Module | Description |
|---|---|
| `auth` | Inscription, connexion, JWT, guards |
| `chatbot` | Chatbot Gemini avec function calling (get_clients, get_produits, create_invoice) |
| `invoice` | CRUD factures, PDF, email, marquage payé |
| `stock` | Gestion des produits et du stock |
| `dashboard` | Statistiques et indicateurs |
| `profile` | Profil utilisateur et entreprise |
| `notification` | Notifications en temps réel |
| `supabase` | Service partagé de connexion Supabase |

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` à la racine (voir `.env.example`) :

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgresql_connection_string
PORT=3000
```

## Démarrage

```bash
# Développement
npm run start:dev

# Production
npm run build
npm run start:prod
```

L'API est disponible sur `http://localhost:3000/api`

## Structure

```
src/
├── auth/
├── chatbot/
├── dashboard/
├── invoice/
├── notification/
├── profile/
├── shared/
├── stock/
├── supabase/
├── app.module.ts
└── main.ts
```

## Équipe

| Membre | Module |
|---|---|
| Islem Trojet | Authentification & Profil |
| Fatma Ezzahra Boujdaria | Factures automatiques - ChatBot |
| Houda Esselmi | Factures manuelles  |
| Idris Jlidi | Stock & Supabase |
| Youssef Nouira | Page d'accueil & Dashboard |

Projet PFA — Institut Supérieur d'Informatique et de Mathématiques de Monastir (ISIMM) — 2025