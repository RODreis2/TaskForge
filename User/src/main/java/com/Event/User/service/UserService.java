package com.Event.User.service;


import com.Event.User.domain.UserModel;
import com.Event.User.dto.request.UserRequest;
import com.Event.User.mapper.UserMapper;
import com.Event.User.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final UserRepository userRepository;


    public List<UserModel> getAllUser(){
        return userRepository.findAll();
    }

    @Transactional
    public UserModel createUser(UserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("E-mail já cadastrado no sistema.");
        }
        UserModel userModel = userMapper.toEntity(request);
        return userRepository.save(userModel);
    }

    public void deleteUser(UUID id){
        if(!userRepository.existsById(id)){
            throw new EntityNotFoundException("User not found");
        }
        userRepository.deleteById(id);
    }


}

