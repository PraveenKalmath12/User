import redisInstance from '../Adapters/redisClient.js';
import Admin from '../Models/Admin.model.js';

let signupCounter = 0;
const MAX_CACHE_ENTRIES = 2;

// Admin Signup
export const signupAdmin = async (req, res) => {
  try {
    const { name, createdby, email, phone, role, block } = req.body;
    const client = redisInstance.getClient();

    // Check if admin exists in Redis cache
    const cachedAdmin = await client.hmgetAsync(email, ['email', 'name', 'createdby', 'phone', 'role', 'block']);

    if (cachedAdmin[0]) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // If not cached, check MongoDB
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      // Store in Redis for future reference
      await client.hmsetAsync(email, {
        email: existingAdmin.email,
        name: existingAdmin.name,
        createdby: existingAdmin.createdby,
        phone: existingAdmin.phone,
        role: existingAdmin.role,
        block: existingAdmin.block.toString(),
      });
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const newAdmin = new Admin({
      name,
      createdby,
      phone,
      email,
      role: 'Admin',
      block: false,
    });

    // Increment signup counter
    signupCounter++;

    // Store new admin in Redis
    await client.hmsetAsync(email, {
      email: newAdmin.email,
      name: newAdmin.name,
      createdby: newAdmin.createdby,
      phone: newAdmin.phone,
      role: newAdmin.role,
      block: newAdmin.block.toString(),
    });

    // Check if we've reached the maximum cache entries
    if (signupCounter >= MAX_CACHE_ENTRIES) {
      // If reached, clear Redis and save all cached entries to MongoDB
      await redisInstance.saveCachedEntriesToMongo();
      signupCounter = 0; // Reset counter after saving
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Update admin details in Redis and MongoDB
// Update admin details in Redis and MongoDB
// export const updateAdminById = async (req, res) => {
//   try {
//     const { email, name, createdby, phone, block } = req.body;
//     const client = redisInstance.getClient();

//     // Only update Redis and increment counter if not yet reached max entries
//     if (signupCounter < MAX_CACHE_ENTRIES) {
//       // Update admin document in MongoDB
//       const updatedAdmin = await Admin.findOneAndUpdate(
//         { email: email },
//         { name: name, createdby: createdby, phone: phone, block: block },
//         { new: true } // Return the updated document
//       );

//       if (!updatedAdmin) {
//         return res.status(404).json({ message: 'Admin not found' });
//       }

//       // Store update in Redis
//       await client.hmsetAsync(email, {
//         name: updatedAdmin.name,
//         createdby: updatedAdmin.createdby,
//         phone: updatedAdmin.phone,
//         role: updatedAdmin.role,
//         block: updatedAdmin.block.toString(),
//       });

//       signupCounter++;
//       console.log(signupCounter)

//       // Check if we've reached the maximum updates
//       if (signupCounter >= MAX_CACHE_ENTRIES) {
//         // If reached, save all cached updates to MongoDB and clear Redis
//         await redisInstance.saveCachedEntriesToMongo();
//         signupCounter = 0; // Reset counter after saving
//       }

//       res.status(200).json({ message: 'Admin updated successfully', updatedAdmin: updatedAdmin });
//     } else {
//       // If already at max entries, update only in Redis
//       // Store update in Redis
//       await client.hmsetAsync(email, {
//         name: name,
//         createdby: createdby,
//         phone: phone,
//         block: block.toString(),
//       });

//       res.status(200).json({ message: 'Admin updated successfully in Redis only' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };


export const updateAdminById = async (req, res) => {
  try {
    const { email, name, createdby, phone, block } = req.body;
    const client = redisInstance.getClient();

    // Update admin in Redis
    await client.hmsetAsync(email, {
      name: name,
      createdby: createdby,
      phone: phone,
      block: block.toString(),
    });

    signupCounter++;
    console.log(signupCounter);

    // Check if we've reached the maximum updates
    if (signupCounter >= MAX_CACHE_ENTRIES) {
      // If reached, save all cached updates to MongoDB and clear Redis
      await redisInstance.saveCachedEntriesToMongo();
      signupCounter = 0; // Reset counter after saving
    }

    res.status(200).json({ message: 'Admin updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch admin by ID from Redis or MongoDB
export const getAdminById = async (req, res) => {
  try {
    const adminId = req.params.id;
    const client = redisInstance.getClient();

    // Check if admin is cached in Redis
    const cachedAdmin = await client.hmgetAsync(adminId, ['email', 'name', 'createdby', 'phone', 'role', 'block']);
    if (cachedAdmin[0]) {
      return res.json({
        email: cachedAdmin[0],
        name: cachedAdmin[1],
        createdby: cachedAdmin[2],
        phone: cachedAdmin[3],
        role: cachedAdmin[4],
        block: cachedAdmin[5] === 'true', 
      });
    }

    // If not cached, fetch from MongoDB
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Cache admin in Redis
    await client.hmsetAsync(adminId, {
      email: admin.email,
      name: admin.name,
      createdby: admin.createdby,
      phone: admin.phone,
      role: admin.role,
      block: admin.block.toString(),
    });

    res.json(admin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch all admins from Redis or MongoDB
export const getAllAdmins = async (req, res) => {
  try {
    const client = redisInstance.getClient();

    // Check if admins list is cached in Redis
    const cachedAdmins = await client.getAsync('admins');
    if (cachedAdmins) {
      return res.json(JSON.parse(cachedAdmins));
    }

    // If not cached, fetch from MongoDB
    const admins = await Admin.find();

    // Cache admins list in Redis
    await client.setAsync('admins', JSON.stringify(admins));

    res.json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete admin by ID from Redis and MongoDB
export const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    const client = redisInstance.getClient();

    // Delete admin from MongoDB
    await Admin.findByIdAndDelete(adminId);

    // Delete admin from Redis
    await client.delAsync(adminId);

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
