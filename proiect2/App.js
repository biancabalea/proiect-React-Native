import React, { useState, useEffect} from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Switch, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from './styles.css';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';

const App = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [tableData, setTableData] = useState({
    Overdue: [],
    Upcoming: [],
    Completed: [],
    Canceled: [],
    taskDates: {},
  });
  const [taskInput, setTaskInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [selectedTask, setSelectedTask] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [alarmsEnabled, setAlarmsEnabled] = useState(false);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);


  const handleDateSelect = (date) => {
    console.log('Data selectată:', date.dateString);
    setSelectedDate(date.dateString);
  };

const handleTimeSelect = (event, selected) => {
  if (event.type === 'set') {
    setSelectedTime(selected || selectedTime);
  }
  setShowDatePicker(false);
}

const handleAddTaskPress = () => {
  console.log('Butonul Add a fost apăsat!');
  setAddModalVisible(true);
  setSettingsModalVisible(false); // Asigurați-vă că fereastra de setări este închisă
};

  const handleTaskAdd = () => {
    addTask(taskInput, 'Upcoming');
    setTaskInput('');
    setAddModalVisible(false);
  };

  const handleTaskPress = (task) => {
    console.log('Task apăsat:', task);
    setSelectedTask(task);
  };

  const handleDeleteTask = (task) => {
    const updatedData = { ...tableData };

    updatedData[task.status] = updatedData[task.status].filter((t) => t !== task);

    delete updatedData.taskDates[task.task];

    setTableData(updatedData);

    if (selectedTask && selectedTask.task === task.task) {
      setSelectedTask(null);
    }
  };

const addTask = (task, status) => {
  const taskWithDate = { task, date: selectedDate, time: selectedTime, emoji: selectedEmoji, status };

  setTableData((prevTableData) => {
    return {
      ...prevTableData,
      [status]: [...prevTableData[status], taskWithDate],
      taskDates: {
        ...prevTableData.taskDates,
        [task]: { date: selectedDate, time: selectedTime },
      },
    };
  });
};
const handleCompleteTask = (task) => {
  console.log('Handle Complete Task:', task);

  const updatedData = { ...tableData };

  // Eliminati task-ul din sectiunea "Upcoming"
  updatedData.Upcoming = updatedData.Upcoming.filter((t) => t !== task);

  // Adaugati task-ul in sectiunea "Completed"
  updatedData.Completed = [...updatedData.Completed, task];

  console.log('Updated Data:', updatedData);

  setTableData(updatedData);

  if (selectedTask && selectedTask.task === task.task) {
    setSelectedTask(null);
  }
};

const handleOverdueTask = (task) => {
  const updatedData = { ...tableData };

  // Eliminăm task-ul din secțiunea curentă ("Upcoming" sau "Completed")
  updatedData[task.status] = updatedData[task.status].filter((t) => t.task !== task.task);

  // Adăugăm task-ul în secțiunea "Overdue"
  updatedData.Overdue = [...updatedData.Overdue, task];

  setTableData(updatedData);

  if (selectedTask && selectedTask.task === task.task) {
    setSelectedTask(null);
  }
};

const handleCanceledTask = (task) => {
  const updatedData = { ...tableData };

  // Eliminăm task-ul din secțiunea curentă ("Upcoming" sau "Completed" sau "Overdue")
  updatedData[task.status] = updatedData[task.status].filter((t) => t.task !== task.task);

  // Adăugăm task-ul în secțiunea "Canceled"
  updatedData.Canceled = [...updatedData.Canceled, task];

  setTableData(updatedData);

  if (selectedTask && selectedTask.task === task.task) {
    setSelectedTask(null);
  }
};

  const EmoticonPicker = () => {
    const emojis = ['😊', '😂', '😍', '👍', '🤔'];

    return (
      <View style={styles.emoticonPicker}>
        {emojis.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.emojiButton, { backgroundColor: selectedEmoji === emoji ? 'yellow' : 'transparent' }]}
            onPress={() => setSelectedEmoji(emoji)}
          >
            <Text>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

const handleSettingsPress = () => {
  console.log('Butonul de setări a fost apăsat!');
  setNotificationsEnabled(false);
  setAlarmsEnabled(false);
  setSettingsModalVisible(true);
  setAddModalVisible(false); // Asigurați-vă că fereastra de adăugare a task-ului este închisă
};

  const handleSaveSettings = async () => {
    // Implementează acțiunile dorite pentru salvarea setărilor
    console.log('Notificări activate:', notificationsEnabled);
    console.log('Alarme activate:', alarmsEnabled);
  if (notificationsEnabled) {
    // Programează notificarea pentru task-urile din secțiunea "Upcoming"
    tableData.Upcoming.forEach((task) => {
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Upcoming',
          body: task.task,
        },
        trigger: {
          seconds: 2, // Poți ajusta acest timp în funcție de când dorești să primești notificarea
        },
      });
    });
  }
    // Dacă alarmele sunt activate, redă melodia
    if (alarmsEnabled) {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/alarma-diminetii.mp3') // Asigură-te că ai fisierul mp3 în folderul assets
      );
      await sound.playAsync();
    }

    setSettingsModalVisible(false);
  };
  useEffect(() => {
    // Verificăm și solicităm permisiunile de notificare la încărcarea componentei
    const askForNotificationPermission = async () => {
      try {
        const { granted } = await Notifications.getPermissionsAsync();

        if (!granted) {
          const { status } = await Notifications.requestPermissionsAsync();

          if (status !== 'granted') {
            alert('Aplicația necesită permisiuni pentru notificări pentru a funcționa corespunzător.');
          }
        }
      } catch (error) {
        console.error('Eroare la solicitarea permisiunilor pentru notificări:', error);
      }
    };

    askForNotificationPermission();
  }, []);

  const handleSendNotification = async () => {
    try {
      // Programăm o notificare
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'PowerTask',
          body: 'Nu uita de task-urile tale.',
        },
        trigger: {
          seconds: 5, // Poți ajusta acest timp în funcție de când dorești să primești notificarea
        },
      });

      alert('Notificare programată cu succes!');
    } catch (error) {
      console.error('Eroare la programarea notificării:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Power Task</Text>
      </View>
      <TouchableOpacity onPress={handleAddTaskPress} style={styles.addButton}>
        <Text style={styles.addButtonLabel}>Add</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSendNotification}>
        <Text style={{ fontSize: 18 }}>Trimite notificare</Text>
      </TouchableOpacity>
      <View style={styles.background}>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={{
            [selectedDate]: { selected: true, marked: true, selectedColor: 'darkpink' },
          }}
          theme={{
            backgroundColor: 'pink',
            calendarBackground: 'pink',
            selectedDayBackgroundColor: 'darkpink',
          }}
        />
        <View style={styles.taskListContainer}>
          <Text>Task-urile pentru {selectedDate}:</Text>
          <View style={styles.tableContainer}>
<View style={styles.tableColumn}>
  <Text>Overdue</Text>
  {tableData.Overdue.map((task, index) => (
    <View key={index} style={{ borderBottomWidth: 1, borderBottomColor: 'gray', paddingBottom: 10 }}>
      <TouchableOpacity onPress={() => handleTaskPress(task)}>
        <Text style={{ fontSize: 16, marginBottom: 5 }}>{task.task}</Text>
        <Text style={{ fontSize: 12, marginBottom: 5 }}>{new Date(task.time).toLocaleTimeString()}</Text>
        <Text style={{ fontSize: 14 }}>{task.emoji}</Text>
      </TouchableOpacity>
    </View>
  ))}
</View>

<View style={styles.tableColumn}>
  <Text>Upcoming</Text>
  {tableData.Upcoming.filter((task) => task.date === selectedDate).map((task, index) => (
    <View key={index} style={{ borderBottomWidth: 1, borderBottomColor: 'gray', paddingBottom: 10 }}>
      <TouchableOpacity onPress={() => handleTaskPress(task)}>
        <Text style={{ fontSize: 16, marginBottom: 5 }}>{task.task}</Text>
        <Text style={{ fontSize: 12, marginBottom: 5 }}>{new Date(task.time).toLocaleTimeString()}</Text>
        <Text style={{ fontSize: 14 }}>{task.emoji}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleCompleteTask(task)} style={{ marginTop: 5, backgroundColor: 'limegreen', padding: 5, borderRadius: 5 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>Complete</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteTask(task)} style={{ marginTop: 5, backgroundColor: 'deeppink', padding: 5, borderRadius: 5 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleOverdueTask(task)} style={{ marginTop: 5, backgroundColor: 'orange', padding: 5, borderRadius: 5 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>Overdue</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleCanceledTask(task)} style={{ marginTop: 5, backgroundColor: 'red', padding: 5, borderRadius: 5 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>Canceled</Text>
      </TouchableOpacity>
      {console.log("Rendered buttons for task:", task)}
    </View>
  ))}
</View>
            <View style={styles.tableColumn}>
             <Text>Completed</Text>
              {tableData.Completed.map((task, index) => (
                <View key={index} style={{ borderBottomWidth: 1, borderBottomColor: 'gray', paddingBottom: 10 }}>
               <TouchableOpacity onPress={() => handleTaskPress(task)}>
                <Text style={{ fontSize: 16, marginBottom: 5 }}>{task.task}</Text>
                <Text style={{ fontSize: 12, marginBottom: 5 }}>{new Date(task.time).toLocaleTimeString()}</Text>
                <Text style={{ fontSize: 14 }}>{task.emoji}</Text>
               </TouchableOpacity>
                </View>
              ))}
            </View>
<View style={styles.tableColumn}>
  <Text>Canceled</Text>
  {tableData.Canceled.map((task, index) => (
    <View key={index} style={{ borderBottomWidth: 1, borderBottomColor: 'gray', paddingBottom: 10 }}>
      <TouchableOpacity onPress={() => handleTaskPress(task)}>
        <Text style={{ fontSize: 16, marginBottom: 5 }}>{task.task}</Text>
        <Text style={{ fontSize: 12, marginBottom: 5 }}>{new Date(task.time).toLocaleTimeString()}</Text>
        <Text style={{ fontSize: 14 }}>{task.emoji}</Text>
      </TouchableOpacity>
    </View>
  ))}
</View>
          </View>
        </View>
      </View>

      <Modal visible={isAddModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Adaugă un nou task:</Text>
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Introdu detaliile task-ului"
              value={taskInput}
              onChangeText={(text) => setTaskInput(text)}
            />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 14 }}>{selectedTime.toLocaleTimeString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={handleTimeSelect}
              />
            )}
            <EmoticonPicker />
            <TouchableOpacity onPress={handleTaskAdd} style={styles.addButton}>
              <Text style={styles.addButtonLabel}>Adaugă Task</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.addButtonLabel}>Anulează</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
            {/* Adaugă butonul de setări */}
      <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
        <Text style={styles.settingsButtonLabel}>Setări</Text>
      </TouchableOpacity>
      <Modal visible={isSettingsModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Setări</Text>

      {/* Slide bar pentru notificări */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text>Activare notificare</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={(value) => setNotificationsEnabled(value)}
        />
      </View>

            {/* Slide bar pentru alarme */}
            <View style={styles.settingRow}>
              <Text>Activare alarmă</Text>
              <Switch
                value={alarmsEnabled}
                onValueChange={(value) => setAlarmsEnabled(value)}
              />
            </View>

            <TouchableOpacity onPress={handleSaveSettings} style={styles.saveButton}>
              <Text style={styles.addButtonLabel}>Salvează</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.addButtonLabel}>Anulează</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default App;