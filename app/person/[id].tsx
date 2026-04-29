import PersonDetailScreen from '../../screens/PersonDetailScreen';
import { useLocalSearchParams as useExpoLocalSearchParams, useNavigation as useExpoNavigation } from 'expo-router';

export default function PersonDetailRoute() {
  const params = useExpoLocalSearchParams();
  const navigation = useExpoNavigation();

  const id = params.id || params.personId;
  const name = params.name || params.personName;

  const route = {
    params: {
      id,
      name,
    }
  };

  return <PersonDetailScreen route={route} navigation={navigation} />;
}
