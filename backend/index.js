const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");



app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/Ecommerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

  app.listen(port,(error)=>{
    if(!error){
        console.log("sever Running on port" +port)
    }
    else
    {
        console.log("Error : "+error)
    }
})
app.get("/",(req,res)=>{
    res.send("Express App is Running")
})
const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)

    }
})
const upload = multer({storage:storage})


app.use('/images',express.static('upload/images'))

app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: "https://www.shutterstock.com/image-vector/yellow-hand-waving-gesture-icon-260nw-1920154661.jpg"
    });
});

const Product = mongoose.model("Product", {

    id: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    new_price: {
      type: Number,
      required: true,
    },
    old_price: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    available: {
      type: Boolean,
      default: true,
    },
  });
  
  // Route to handle adding a product
  app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if(products.length>0)
    {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id=1;
    }
    try {
      const { name, id, old_price, new_price, category, image } = req.body;
  
      const product = new Product({
        name: name,
        id: id,
        old_price: old_price,
        new_price: new_price,
        category: category,
        image: image,
      });
  
      console.log(product);
      await product.save();
      console.log("Saved");
      res.json({
        success: true,
        name: name,
      });
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})
   
app.get('/allproducts', async (req, res) => {
    try {
        let products = await Product.find({});

        console.log("All Products Fetched");

        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});

const Users = mongoose.model('Users', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

app.post('/signup', async (req, res) => {
    try {
        let check = await Users.findOne({ email: req.body.email });
        if (check) {
            return res.status(400).json({ success: false, errors: "Existing user found with the same email" });
        }

        let cart = {};
        for (let i = 0; i < 300; i++) {
            cart[i] = 0;
        }

        const user = new Users({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            cartData: cart,
        });

        await user.save();

        const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom');

        res.json({ success: true, token });
    } catch (error) {
        console.error("Error signing up:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});

app.post('/login', async (req, res) => {
    try {
        let user = await Users.findOne({ email: req.body.email });

        if (user) {
            const passCompare = req.body.password === user.password;

            if (passCompare) {
                const data = {
                    user: {
                        id: user.id
                    }
                };

                const token = jwt.sign(data, 'secret_ecom');
                res.json({ success: true, token });
            } else {
                res.json({ success: false, errors: "Wrong Password" });
            }
        } else {
            res.json({ success: false, errors: "Wrong Email Id" });
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
