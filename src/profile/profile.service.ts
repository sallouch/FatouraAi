import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { User } from '../auth/auth.entity';
import { Company } from './company.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class ProfileService {
  private supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← corriger le nom
);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    return {
      name:       user.fullName ?? '',
      email:      user.email ?? '',
      company:    user.company?.nom ?? '',
      phone:      user.phone ?? '',
      address:    user.company?.adresse ?? '',
      city:       user.company?.ville ?? '',
      postalCode: user.company?.codePostal ?? '',
      country:    user.company?.pays ?? '',
      taxId:      user.company?.matriculeFiscal ?? '',
      avatarUrl:  user.avatarUrl ?? '',
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (dto.name)      user.fullName  = dto.name;
     if (dto.phone)     user.phone     = dto.phone;  // ← ajouter
    if (dto.avatarUrl) user.avatarUrl = dto.avatarUrl;

    await this.userRepository.save(user);
    return { success: true, message: 'Profil mis à jour avec succès' };
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const passwordMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Mot de passe actuel incorrect');

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
    return { success: true, message: 'Mot de passe modifié avec succès' };
  }

  async updateAvatar(userId: string, base64: string, mimeType: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    // Convertir base64 en buffer
    const buffer = Buffer.from(base64, 'base64');
    const ext = mimeType.split('/')[1];
    const filename = `avatar-${userId}.${ext}`;

    // Uploader dans Supabase Storage
    const { error } = await this.supabase.storage
      .from('avatars')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: true, // remplace si existe déjà
      });

    if (error) throw new Error(`Erreur upload Supabase: ${error.message}`);

    // Récupérer l'URL publique
    const { data } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    user.avatarUrl = data.publicUrl;
    await this.userRepository.save(user);

    return { avatarUrl: data.publicUrl };
  }

  async updateCompany(userId: string, dto: UpdateCompanyDto): Promise<Company> {
    let company = await this.companyRepository.findOne({ where: { userId } });

    if (!company) {
      company = this.companyRepository.create({
        userId,
        nom:             dto.companyName ?? '',
        matriculeFiscal: dto.vatNumber,
        adresse:         dto.address,
        ville:           dto.city,
        codePostal:      dto.postalCode,
        pays:            dto.country ?? '',
      });
    } else {
      if (dto.companyName !== undefined) company.nom             = dto.companyName;
      if (dto.vatNumber   !== undefined) company.matriculeFiscal = dto.vatNumber;
      if (dto.address     !== undefined) company.adresse         = dto.address;
      if (dto.city        !== undefined) company.ville           = dto.city;
      if (dto.postalCode  !== undefined) company.codePostal      = dto.postalCode;
      if (dto.country     !== undefined) company.pays            = dto.country;
    }

    return this.companyRepository.save(company);
  }
}