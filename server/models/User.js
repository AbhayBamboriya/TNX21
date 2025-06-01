const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true
  },
  enrollmentNo: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function (value) {
        // Required only if role is student
        if (this.role === 'student') {
          return value != null && value.trim() !== '';
        }
        return true;
      },
      message: 'Enrollment number is required for students'
    }
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function (value) {
        // Required only if role is NOT student
        if (this.role !== 'student') {
          return value != null && value.trim() !== '';
        }
        return true;
      },
      message: 'Email is required for non-students'
    }
  },
  password: {
    type: String,
  },
  name: {
    type: String
  },
  grade: {
    type: String,
    required: function () {
      return this.role === 'student';
    }
  },
  subjects: {
    type: [String]
  }
});



// UserSchema.pre('save',async function(next){
//     if(!this.isModified('password')){
//         return next()
//     }
//     this.password=await bcrypt.hash(this.password,10)
// })
// 🔐 Compare hashed passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  console.log(enteredPassword,this.password);
  console.log(await bcrypt.compare(enteredPassword,this.password));
  
  return await bcrypt.compare(enteredPassword, this.password);
};

// // 🔑 Generate JWT
UserSchema.methods.generateJWTToken= async function(){
        return await jwt.sign(
            {id:this._id ,email:this.email,subscription:this.subscription,role:this.role},
            process.env.JWT_SECRET,
            {
                expiresIn:process.env.JWT_EXPIRY,
            }
        )
    },

UserSchema.methods.generatePasswordResetToken=async function(){
        // it will generate random token
        // directly used library
        const resetToken=crypto.randomBytes(20).toString('hex')
        this.forgotPasswordToken=crypto
        // converting reset token to encrypted form// ;
            .createHash('sha256')
            .update(resetToken)
            .digest('hex')
        this.forgotPasswordExpiry=Date.now()+15*60*1000 //15 min from now
        return resetToken
    }
module.exports = mongoose.model('User', UserSchema);
