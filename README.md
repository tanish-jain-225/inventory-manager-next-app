## NEXT App deployment on vercel 

### MongoDB Configuration
- Add your MongoDB URI, database name, and collection name to a `.env.local` file in the root directory:
  ```
  MONGODB_URI=your-mongodb-uri
  DB_NAME=your-database-name
  COLLECTION_NAME=your-collection-name
  ```

### Deployment Steps
1. Check the file structure of the app:
   - Main folder contains:
     - `app` folder and its components.
     - Configuration and `.js` files of the Next.js app.
     - `package.json` and `package-lock.json`.
2. Ensure all required modules are specified in `package-lock.json`.
3. Deploy the app on Vercel as a Next.js app with the root folder set to `./`.
4. After automatic deployment, the app is ready to use.
5. Use the deployed app link to access the app anytime and anywhere.
