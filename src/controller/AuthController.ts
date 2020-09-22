import { getRepository } from 'typeorm'
import { Request, Response } from 'express';
import { User } from '../entity/User';
import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import { validate } from 'class-validator';

class AuthController {
    static login = async (req: Request, res: Response) => {
        const { username, password } = req.body;
        if (!(username && password)) {
            return res.status(400).json({ message: 'Username & password are required!' });
        }
        const userRepository = getRepository(User);
        let user: User;
        try {
            user = await userRepository.findOneOrFail({ where: { username } })

        } catch (error) {
            return res.status(400).json({ message: 'Username or password incorrect!' });
        }

        //check password
        if (!user.checkpassword(password)) {
            return res.status(400).json({ message: 'username or password incorrect!' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, config.jwtSecret,
            { expiresIn: '1h' });
        res.json({ message: 'Ok', token });
    };

    static changePassword = async (req: Request, res: Response) => {
        const { userId } = res.locals.jwtPayload;
        const { oldPassword, newPassword } = req.body;

        if (!(oldPassword && newPassword)) {
            return res.status(400).json({ message: 'Old password and new password are required!' });
        }

        const userRepository = getRepository(User);
        let user: User;


        try {
            user = await userRepository.findOneOrFail(userId);

        } catch (error) {
            return res.status(400).json({ message: 'Something goes wrong!' });
        }

        if (!user.checkpassword(oldPassword)) {
            return res.status(401).json({ message: 'Check your old password' });
        }

        user.password = newPassword;
        const error = await validate(user, { validationError: { target: false, value: false } });
        if (error.length > 0) {
            return res.status(400).json(error);
        }

        //Hash Password
        user.hashPassword();
        userRepository.save(user);
        res.json({ message: 'Password change!' });


    }
}
export default AuthController;



